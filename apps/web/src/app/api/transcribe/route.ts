import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/auth'

const openai = new OpenAI()

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const audio = formData.get('audio') as File | null
  if (!audio) return NextResponse.json({ error: 'No audio' }, { status: 400 })

  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audio,
  })

  return NextResponse.json({ text: transcription.text })
}
