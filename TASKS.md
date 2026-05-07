# TASKS.md

Build tasks in order. Complete one before moving to the next. Check off each task when done.

## 1. Database

- [x] Enable pgvector extension (`CREATE EXTENSION IF NOT EXISTS vector;`)
- [x] Add `Thread` model to `schema.prisma`
- [x] Add `Bead` model to `schema.prisma` with self-relation for `supersedes`
- [x] Run migration (`npm run db:migrate`)
- [x] Run `npm run db:generate`

## 2. Thread server actions

- [x] `createThread(title)` — create a thread for the authed user, revalidate thread list
- [x] `getThreads()` — fetch all threads for the authed user
- [x] `updateThread(id, { title?, status? })` — rename or tie up a thread, revalidate thread list

## 3. Bead server actions

- [x] `getBeads(threadId)` — fetch beads for a thread; resolve supersedes chain and return latest version of each note only, with full history available
- [x] `markTaskDone(beadId)` — mark a task bead as done, revalidate thread feed
- [x] `submitDump(threadId, dump)` — run extraction, write resulting beads, return new beads

## 4. Extraction service

- [x] Create `apps/web/src/lib/extract.ts` — takes a dump string + thread context beads, calls Claude API, returns parsed bead JSON
- [x] Implement hybrid context retrieval: last 5 beads by `createdAt` + top 5 by vector similarity to the dump, deduped
- [x] Implement embedding generation for new/updated beads after extraction
- [x] Wire extraction service into `submitDump`

## 5. Frontend — layout and sidebar

- [x] Create `/dashboard` layout with sidebar + main content area unless it already exists.
- [x] Sidebar: list of threads, active state, new thread button
- [x] Sidebar: show tied threads as struck-through
- [x] New thread: inline input or modal to name and create a thread

## 6. Frontend — thread view

- [x] Thread header: title, active/tied badge, three-dot menu (rename, tie up)
- [x] Bead feed: chronological list of beads, all types interleaved
- [x] Note bead component: title + markdown content + history toggle
- [ ] Task bead component: checkbox (with done state, optimistic update on check), title, optional due date
- [ ] Link bead component: URL + label with external link icon
- [ ] History toggle: expand superseded bead chain beneath the latest version

## 7. Frontend — dump input

- [ ] Textarea with send button (use send icon, not text)
- [ ] On submit: call `submitDump`, optimistically append placeholder beads to feed immediately
- [ ] On response: replace placeholder beads with real beads from server
- [ ] Error state: remove placeholders and surface error if extraction fails
