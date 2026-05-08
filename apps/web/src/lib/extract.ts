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

const MERGE_SYSTEM_PROMPT = `You are a personal knowledge assistant. Merge two note beads into a single coherent note that preserves all important information from both.

Rules:
- Combine the content intelligently, removing duplication
- Write a title that reflects the merged content
- All content must be in markdown
- Respond ONLY with valid JSON, no preamble or markdown fences

Response shape:
{
  "title": "...",
  "content": "..."
}`

export async function mergeNotes(
  noteA: { title: string; content: string },
  noteB: { title: string; content: string }
): Promise<{ title: string; content: string }> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: MERGE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify({ note_a: noteA, note_b: noteB }) }],
  })
  const raw = message.content.find((b) => b.type === 'text')?.text ?? ''
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(text) as { title: string; content: string }
}

const SYSTEM_PROMPT = `You are a personal knowledge assistant. The user has submitted an info dump into a Thread.
Given the thread's existing beads as context and the raw dump, produce meaningful beads.

Rules:
- Always produce at least one bead. The user has deliberately submitted this dump and expects it to be captured.
- Extract tasks (things to do) as task beads and links (URLs) as link beads.
- For note content: strongly prefer updating an existing note over creating a new one. If the dump is about the same subject as an existing note bead — even partially — produce an updated_bead that rewrites that note to incorporate the new information. Only create a new note bead if the content is genuinely about a different subject with no relevant existing note.
- When updating, the updated note should contain all the information from the original plus the new information — do not lose existing content.
- All note content must be formatted in markdown. Use headings, bullet points, bold, and other markdown elements to structure the information clearly. Never write note content as a plain paragraph when structure would help.
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
