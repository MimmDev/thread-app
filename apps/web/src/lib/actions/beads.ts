'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { extract, updateBeadFromDump, embedText, beadToText, mergeNotes, type NewBead } from '@/lib/extract'
import { fetchOg } from '@/lib/og'
import { Prisma } from '@/generated/prisma/client'

async function getAuthenticatedUser() {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  const user = await db.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('User not found')

  return user
}

export async function updateBeadContent(beadId: string, dump: string) {
  const user = await getAuthenticatedUser()
  const bead = await db.bead.findUnique({ where: { id: beadId }, include: { thread: true } })
  if (!bead || bead.thread.userId !== user.id) throw new Error('Bead not found')

  const updatedContent = await updateBeadFromDump({ type: bead.type, content: bead.content }, dump)
  await db.bead.update({ where: { id: beadId }, data: { content: updatedContent as object } })

  revalidatePath('/dashboard')
  return getBeadsForThread(bead.threadId)
}

export async function deleteBead(beadId: string) {
  const user = await getAuthenticatedUser()
  const bead = await db.bead.findUnique({ where: { id: beadId }, include: { thread: true } })
  if (!bead || bead.thread.userId !== user.id) throw new Error('Bead not found')
  await db.bead.delete({ where: { id: beadId } })
  revalidatePath('/dashboard')
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

  const { new_beads } = await extract(dump)

  // Enrich link beads with OG metadata
  await Promise.all(
    new_beads.map(async (b) => {
      if (b.type === 'link') Object.assign(b, await fetchOg(b.url))
    })
  )

  const created = await Promise.all(
    new_beads.map((b: NewBead) => {
      const content = b.type === 'task' ? { ...b, done: false } : b
      return db.bead.create({ data: { threadId, type: b.type, content: content as object } })
    })
  )

  // Store the dump embedding on the first created bead; embed each bead individually too
  await Promise.all(
    created.map(async (bead, i) => {
      const embedding = await embedText(beadToText(new_beads[i] as NewBead))
      const v = `[${embedding.join(',')}]`
      await db.$executeRaw`UPDATE "Bead" SET embedding = ${Prisma.raw(`'${v}'`)}::vector WHERE id = ${bead.id}`
    })
  )

  revalidatePath('/dashboard')
  return getBeadsForThread(threadId)
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
  return getBeadsForThread(beadA.threadId)
}

async function getBeadsForThread(threadId: string) {
  const allBeads = await db.bead.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
  })

  const mergedFromIds = new Set(allBeads.flatMap((b) => b.mergedFrom))

  return allBeads
    .filter((b) => !mergedFromIds.has(b.id))
    .map((bead) => {
      const mergedBeads = (bead.mergedFrom ?? [])
        .map((id) => allBeads.find((b) => b.id === id))
        .filter((b): b is typeof allBeads[number] => b !== undefined)
      return { ...bead, mergedBeads }
    })
}

export type BeadWithHistory = Awaited<ReturnType<typeof getBeadsForThread>>[number]

export async function getBeads(threadId: string) {
  const user = await getAuthenticatedUser()
  const thread = await db.thread.findUnique({ where: { id: threadId, userId: user.id } })
  if (!thread) throw new Error('Thread not found')
  return getBeadsForThread(threadId)
}
