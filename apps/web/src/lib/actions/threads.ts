'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/lib/db'

async function getAuthenticatedUser() {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  const user = await db.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('User not found')

  return user
}

export async function createThread(title: string) {
  const user = await getAuthenticatedUser()

  const thread = await db.thread.create({
    data: { title, userId: user.id },
  })

  revalidatePath('/dashboard')
  return thread
}
