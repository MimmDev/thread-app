import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export type NewBead =
  | { type: 'note'; title: string; content: string }
  | { type: 'task'; title: string; due_at: string | null }
  | { type: 'link'; url: string; label: string }

export type UpdatedBead = { supersedes: string } & {
  type: 'note'
  title: string
  content: string
}

export type ExtractionResult = {
  new_beads: NewBead[]
  updated_beads: UpdatedBead[]
}

const anthropic = new Anthropic()
const openai = new OpenAI()

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

export function beadToText(bead: NewBead): string {
  switch (bead.type) {
    case 'note': return `${bead.title}\n${bead.content}`
    case 'task': return bead.title
    case 'link': return `${bead.label} ${bead.url}`
  }
}

const SYSTEM_PROMPT = `You are a personal knowledge assistant. The user has submitted an info dump into a Thread.
Given the thread's existing beads as context and the raw dump, produce meaningful beads.

Rules:
- Create new beads for genuinely new information.
- If something updates an existing note bead, produce an updated_bead with the existing bead's ID in supersedes.
- Extract tasks (things to do) and links (URLs) as their own bead types.
- All note content must be in markdown.
- If none of the existing beads are relevant, ignore them.
- Respond ONLY with valid JSON, no preamble or markdown fences.

Response shape:
{
  "new_beads": [
    { "type": "note", "title": "...", "content": "..." },
    { "type": "task", "title": "...", "due_at": "ISO8601 or null" },
    { "type": "link", "url": "...", "label": "..." }
  ],
  "updated_beads": [
    { "supersedes": "<existing bead id>", "type": "note", "title": "...", "content": "..." }
  ]
}`

export async function extract(
  dump: string,
  contextBeads: unknown[]
): Promise<ExtractionResult> {
  const userMessage = JSON.stringify({ context_beads: contextBeads, dump })

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const raw = message.content.find((b) => b.type === 'text')?.text ?? ''
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(text) as ExtractionResult
}
