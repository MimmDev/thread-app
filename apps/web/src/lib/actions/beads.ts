'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { extract, embedText, beadToText, mergeNotes, type NewBead } from '@/lib/extract'
import { fetchOg } from '@/lib/og'
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

  await db.bead.update({
    where: { id: beadId },
    data: { content: { ...content, done: true } },
  })

  revalidatePath('/dashboard')
}

export async function markTaskUndone(beadId: string) {
  const user = await getAuthenticatedUser()

  const bead = await db.bead.findUnique({ where: { id: beadId }, include: { thread: true } })
  if (!bead || bead.thread.userId !== user.id) throw new Error('Bead not found')
  if (bead.type !== 'task') throw new Error('Bead is not a task')

  const content = bead.content as { title: string; due_at: string | null; done: boolean }

  await db.bead.update({
    where: { id: beadId },
    data: { content: { ...content, done: false } },
  })

  revalidatePath('/dashboard')
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

  // Look up mergedFrom on any bead being superseded so it carries forward
  const supersededBeadIds = updated_beads.map((b) => b.supersedes).filter(Boolean) as string[]
  const supersededBeads = supersededBeadIds.length
    ? await db.bead.findMany({ where: { id: { in: supersededBeadIds } }, select: { id: true, mergedFrom: true, content: true } })
    : []
  const mergedFromBySupersededId = Object.fromEntries(supersededBeads.map((b) => [b.id, b.mergedFrom ?? []]))
  const doneBySupersededId = Object.fromEntries(
    supersededBeads.map((b) => [b.id, (b.content as { done?: boolean }).done ?? false])
  )

  // Enrich link beads with OG metadata
  await Promise.all(
    new_beads.map(async (b) => {
      if (b.type === 'link') {
        const og = await fetchOg(b.url)
        Object.assign(b, og)
      }
    })
  )

  const created = await Promise.all([
    ...new_beads.map((b: NewBead) => {
      const content = b.type === 'task' ? { ...b, done: false } : b
      return db.bead.create({ data: { threadId, type: b.type, content: content as object } })
    }),
    ...updated_beads.map((b) => {
      const content = b.type === 'task'
        ? { ...b, done: doneBySupersededId[b.supersedes] ?? false }
        : b
      return db.bead.create({
        data: {
          threadId,
          type: b.type,
          content: content as object,
          supersedes: b.supersedes,
          mergedFrom: mergedFromBySupersededId[b.supersedes] ?? [],
        },
      })
    }),
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

  // Return the fully-processed bead list so the client can replace state correctly,
  // handling superseded beads and history chains without a separate round-trip.
  const allBeads = await db.bead.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
  })
  const supersededIds2 = new Set(
    allBeads.map((b) => b.supersedes).filter((id): id is string => id !== null)
  )
  const mergedFromIds2 = new Set(allBeads.flatMap((b) => b.mergedFrom ?? []))
  return allBeads
    .filter((b) => !supersededIds2.has(b.id) && !mergedFromIds2.has(b.id))
    .map((bead) => {
      const history: typeof allBeads = []
      let cursor = bead.supersedes
      while (cursor) {
        const prev = allBeads.find((b) => b.id === cursor)
        if (!prev) break
        history.push(prev)
        cursor = prev.supersedes
      }
      const mergedBeads = (bead.mergedFrom ?? [])
        .map((id) => allBeads.find((b) => b.id === id))
        .filter((b): b is typeof allBeads[number] => b !== undefined)
      return { ...bead, history, mergedBeads }
    })
}

export async function joinBeads(beadIdA: string, beadIdB: string) {
  const user = await getAuthenticatedUser()

  const [beadA, beadB] = await Promise.all([
    db.bead.findUnique({ where: { id: beadIdA }, include: { thread: true } }),
    db.bead.findUnique({ where: { id: beadIdB }, include: { thread: true } }),
  ])

  if (!beadA || beadA.thread.userId !== user.id) throw new Error('Bead not found')
  if (!beadB || beadB.thread.userId !== user.id) throw new Error('Bead not found')
  if (beadA.threadId !== beadB.threadId) throw new Error('Beads must be in the same thread')
  if (beadA.type !== 'note' || beadB.type !== 'note') throw new Error('Only note beads can be joined')

  const contentA = beadA.content as { title: string; content: string }
  const contentB = beadB.content as { title: string; content: string }
  const merged = await mergeNotes(contentA, contentB)

  const newBead = await db.bead.create({
    data: {
      threadId: beadA.threadId,
      type: 'note',
      content: { title: merged.title, content: merged.content },
      mergedFrom: [beadIdA, beadIdB],
    },
  })

  const embedding = await embedText(`${merged.title}\n${merged.content}`)
  const vectorLiteral = `[${embedding.join(',')}]`
  await db.$executeRaw`
    UPDATE "Bead" SET embedding = ${Prisma.raw(`'${vectorLiteral}'`)}::vector WHERE id = ${newBead.id}
  `

  revalidatePath('/dashboard')

  const allBeads = await db.bead.findMany({
    where: { threadId: beadA.threadId },
    orderBy: { createdAt: 'asc' },
  })
  const supersededIds = new Set(
    allBeads.map((b) => b.supersedes).filter((id): id is string => id !== null)
  )
  const mergedFromIds = new Set(allBeads.flatMap((b) => b.mergedFrom))
  return allBeads
    .filter((b) => !supersededIds.has(b.id) && !mergedFromIds.has(b.id))
    .map((bead) => {
      const history: typeof allBeads = []
      let cursor = bead.supersedes
      while (cursor) {
        const prev = allBeads.find((b) => b.id === cursor)
        if (!prev) break
        history.push(prev)
        cursor = prev.supersedes
      }
      const mergedBeads = (bead.mergedFrom ?? [])
        .map((id) => allBeads.find((b) => b.id === id))
        .filter((b): b is typeof allBeads[number] => b !== undefined)
      return { ...bead, history, mergedBeads }
    })
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

  const supersededIds = new Set(
    allBeads.map((b) => b.supersedes).filter((id): id is string => id !== null)
  )
  const mergedFromIds = new Set(allBeads.flatMap((b) => b.mergedFrom))

  return allBeads
    .filter((b) => !supersededIds.has(b.id) && !mergedFromIds.has(b.id))
    .map((bead) => {
      const history: typeof allBeads = []
      let cursor = bead.supersedes
      while (cursor) {
        const prev = allBeads.find((b) => b.id === cursor)
        if (!prev) break
        history.push(prev)
        cursor = prev.supersedes
      }
      const mergedBeads = (bead.mergedFrom ?? [])
        .map((id) => allBeads.find((b) => b.id === id))
        .filter((b): b is typeof allBeads[number] => b !== undefined)
      return { ...bead, history, mergedBeads }
    })
}
