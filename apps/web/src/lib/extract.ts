import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export type NewBead =
  | { type: 'note'; title: string; content: string }
  | { type: 'task'; title: string; due_at: string | null; url?: string }
  | { type: 'link'; url: string; label: string }

export type UpdatedBead = { supersedes: string } & (
  | { type: 'note'; title: string; content: string }
  | { type: 'task'; title: string; due_at: string | null; url?: string }
)

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

const SYSTEM_PROMPT = `You are a personal knowledge assistant. The user has submitted an info dump into a Thread.
Given the thread's existing beads as context and the raw dump, produce meaningful beads.

Rules:
- Always produce at least one bead. The user has deliberately submitted this dump and expects it to be captured.
- Extract tasks (things to do) as task beads. If the dump includes a URL alongside a task, you MUST copy the URL verbatim into the task's "url" field — do not omit it, do not create a separate link bead for it. Example: "check my email https://mail.google.com" → { "type": "task", "title": "Check my email", "due_at": null, "url": "https://mail.google.com" }.
- Create a link bead only for a standalone URL with no surrounding task context.
- For notes: strongly prefer updating an existing note over creating a new one. If the dump is about the same subject as an existing note bead — even partially — produce an updated_bead that rewrites that note to incorporate the new information. Only create a new note bead if the content is genuinely about a different subject with no relevant existing note. When updating, incorporate all old and new information without losing content.
- For tasks: if the dump refers to an existing task (same action, even if worded differently) — e.g. adding a due date, changing the deadline, or refining the title — produce an updated_bead for that task instead of a new one.
- All note content must be in markdown.
- If none of the existing beads are relevant, ignore them.
- Respond ONLY with valid JSON, no preamble or markdown fences.

Response shape:
{
  "new_beads": [
    { "type": "note", "title": "...", "content": "..." },
    { "type": "task", "title": "...", "due_at": "ISO8601 or null", "url": "https://... or omit if no URL" },
    { "type": "link", "url": "...", "label": "..." }
  ],
  "updated_beads": [
    { "supersedes": "<existing bead id>", "type": "note", "title": "...", "content": "..." },
    { "supersedes": "<existing bead id>", "type": "task", "title": "...", "due_at": "ISO8601 or null", "url": "https://... or omit" }
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
  const result = JSON.parse(text) as ExtractionResult

  // Format all note content in parallel
  await Promise.all([
    ...result.new_beads.map(async (b) => {
      if (b.type === 'note') b.content = await formatNoteContent(b.content)
    }),
    ...result.updated_beads.map(async (b) => {
      if (b.type === 'note') b.content = await formatNoteContent(b.content)
    }),
  ])

  return result
}
