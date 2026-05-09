import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { presignPut } from '@/lib/s3'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

  const { filename, mimeType, size } = await req.json()
  if (!filename || !mimeType || !size) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const key = `${user.id}/${randomUUID()}`
  const url = await presignPut(key, mimeType, size)

  return NextResponse.json({ key, url })
}
