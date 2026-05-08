import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export type NewBead =
  | { type: 'note'; title: string; content: string }
  | { type: 'task'; title: string; due_at: string | null; url?: string }
  | { type: 'link'; url: string; label: string }

export type ExtractionResult = {
  new_beads: NewBead[]
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
- All content must be formatted in markdown with proper heading syntax (## for sections, ### for subsections), bullet points, and bold text. Never write section names as plain lines — always prefix them with ##.
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

export async function formatNoteContent(content: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: `You are a markdown formatter. Rewrite the given note content with proper markdown structure and remove any duplicate information.

Rules:
- Section names MUST become ## headings. A bare word or phrase on its own line is a section name — prefix it with ##.
- Lists of items MUST become bullet points using "- item".
- Use **bold** for key terms and important statements.
- Remove duplicate or redundant information — say each thing once.
- You may reword for clarity but do not add new information.
- Return ONLY the reformatted markdown, no preamble or explanation.

Example input:
Overall Assessment
Jose was a bad candidate.
Red Flags
Needs React experience
Needs Angular experience

Example output:
## Overall Assessment
Jose was a bad candidate.

## Red Flags
- Needs React experience
- Needs Angular experience`,
    messages: [{ role: 'user', content }],
  })
  return message.content.find((b) => b.type === 'text')?.text.trim() ?? content
}

const UPDATE_SYSTEM_PROMPT = `You are a personal knowledge assistant. The user has selected an existing bead and submitted a dump describing changes to it. Update the bead's content based on the dump.

Rules:
- Modify only what the dump explicitly changes or adds. Preserve everything else.
- For notes: content must be in clear, well-structured markdown.
- For tasks: if the dump mentions a new due date, parse it as ISO8601. If it removes the due date, set due_at to null.
- Respond ONLY with valid JSON matching the bead's current shape exactly — no preamble or markdown fences.

Response shapes by type:
  note:  { "title": "...", "content": "..." }
  task:  { "title": "...", "due_at": "ISO8601 or null", "done": true|false, "url": "... or omit" }
  link:  { "url": "...", "label": "..." }`

export async function updateBeadFromDump(
  bead: { type: string; content: unknown },
  dump: string,
): Promise<unknown> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: UPDATE_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: JSON.stringify({ current_bead: { type: bead.type, content: bead.content }, dump }),
    }],
  })
  const raw = message.content.find((b) => b.type === 'text')?.text ?? ''
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(text)
}

const SYSTEM_PROMPT = `You are a personal knowledge assistant. The user has submitted an info dump into a Thread.
Extract structured beads from the dump. Each dump becomes one or more new beads — do not try to merge with existing beads.

Rules:
- Always produce at least one bead.
- Extract tasks (things to do) as task beads. If the dump includes a URL alongside a task, copy the URL verbatim into the task's "url" field. Example: "check my email https://mail.google.com" → { "type": "task", "title": "Check my email", "due_at": null, "url": "https://mail.google.com" }.
- Create a link bead only for a standalone URL with no surrounding task context.
- Note content must be in clear, well-structured markdown.
- Respond ONLY with valid JSON, no preamble or markdown fences.

Response shape:
{
  "new_beads": [
    { "type": "note", "title": "...", "content": "..." },
    { "type": "task", "title": "...", "due_at": "ISO8601 or null", "url": "https://... or omit if no URL" },
    { "type": "link", "url": "...", "label": "..." }
  ]
}`

export async function extract(
  dump: string,
): Promise<ExtractionResult> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: dump }],
  })

  const raw = message.content.find((b) => b.type === 'text')?.text ?? ''
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const result = JSON.parse(text) as ExtractionResult

  await Promise.all(
    result.new_beads.map(async (b) => {
      if (b.type === 'note') b.content = await formatNoteContent(b.content)
    })
  )

  return result
}
