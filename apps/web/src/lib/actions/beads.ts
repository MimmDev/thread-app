'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { extract, embedText, beadToText, type NewBead } from '@/lib/extract'
import { Prisma } from '@/generated/prisma/client'

async function getAuthenticatedUser() {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  const user = await db.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('User not found')

  return user
}

export async function markTaskDone(beadId: string) {
  const user = await getAuthenticatedUser()

  const bead = await db.bead.findUnique({ where: { id: beadId }, include: { thread: true } })
  if (!bead || bead.thread.userId !== user.id) throw new Error('Bead not found')
  if (bead.type !== 'task') throw new Error('Bead is not a task')

  const content = bead.content as { title: string; due_at: string | null; done: boolean }

  const updated = await db.bead.update({
    where: { id: beadId },
    data: { content: { ...content, done: true } },
  })

  revalidatePath('/dashboard')
  return updated
}

export async function submitDump(threadId: string, dump: string) {
  const user = await getAuthenticatedUser()

  const thread = await db.thread.findUnique({ where: { id: threadId, userId: user.id } })
  if (!thread) throw new Error('Thread not found')

  const [recentBeads, dumpEmbedding] = await Promise.all([
    db.bead.findMany({ where: { threadId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    embedText(dump),
  ])

  const vectorLiteral = `[${dumpEmbedding.join(',')}]`
  type BeadRow = { id: string }
  const similarRows = await db.$queryRaw<BeadRow[]>`
    SELECT id FROM "Bead"
    WHERE "threadId" = ${threadId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${Prisma.raw(`'${vectorLiteral}'`)}::vector
    LIMIT 5
  `

  const recentIds = new Set(recentBeads.map((b) => b.id))
  const extraIds = similarRows.map((r) => r.id).filter((id) => !recentIds.has(id))
  const extraBeads = extraIds.length
    ? await db.bead.findMany({ where: { id: { in: extraIds } } })
    : []

  const contextBeads = [...recentBeads, ...extraBeads]

  const { new_beads, updated_beads } = await extract(dump, contextBeads)

  const created = await Promise.all([
    ...new_beads.map((b: NewBead) =>
      db.bead.create({ data: { threadId, type: b.type, content: b as object } })
    ),
    ...updated_beads.map((b) =>
      db.bead.create({
        data: { threadId, type: b.type, content: b as object, supersedes: b.supersedes },
      })
    ),
  ])

  // Generate and store embeddings for all newly created beads
  const allExtracted = [...new_beads, ...updated_beads]
  await Promise.all(
    created.map(async (bead, i) => {
      const source = allExtracted[i]
      const embedding = await embedText(beadToText(source as NewBead))
      const vectorLiteral = `[${embedding.join(',')}]`
      await db.$executeRaw`
        UPDATE "Bead"
        SET embedding = ${Prisma.raw(`'${vectorLiteral}'`)}::vector
        WHERE id = ${bead.id}
      `
    })
  )

  revalidatePath('/dashboard')
  return created
}

export type BeadWithHistory = Awaited<ReturnType<typeof getBeads>>[number]

export async function getBeads(threadId: string) {
  const user = await getAuthenticatedUser()

  // Verify thread belongs to user
  const thread = await db.thread.findUnique({ where: { id: threadId, userId: user.id } })
  if (!thread) throw new Error('Thread not found')

  const allBeads = await db.bead.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
  })

  // Build set of bead IDs that are superseded by another bead
  const supersededIds = new Set(
    allBeads.map((b) => b.supersedes).filter((id): id is string => id !== null)
  )

  // For each current (non-superseded) bead, walk back the supersedes chain to build history
  return allBeads
    .filter((b) => !supersededIds.has(b.id))
    .map((bead) => {
      const history: typeof allBeads = []
      let cursor = bead.supersedes
      while (cursor) {
        const prev = allBeads.find((b) => b.id === cursor)
        if (!prev) break
        history.push(prev)
        cursor = prev.supersedes
      }
      return { ...bead, history }
    })
}
