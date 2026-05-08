"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { embedText } from "@/lib/extract";
import { Prisma } from "@/generated/prisma/client";

export type SearchResult = {
  id: string;
  type: string;
  content: unknown;
  threadId: string;
  threadTitle: string;
  threadStatus: string;
};

export async function searchBeads(query: string): Promise<SearchResult[]> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  const [embedding, titleMatches, contentMatches] = await Promise.all([
    embedText(query),
    db.thread.findMany({
      where: {
        userId: user.id,
        title: { contains: query, mode: "insensitive" },
      },
      select: { id: true, title: true, status: true },
    }),
    db.$queryRaw<SearchResult[]>`
      SELECT b.id, b.type, b.content, b."threadId",
             t.title AS "threadTitle", t.status AS "threadStatus"
      FROM "Bead" b
      JOIN "Thread" t ON t.id = b."threadId"
      WHERE t."userId" = ${user.id}
        AND b.type NOT IN ('_placeholder')
        AND b.content::text ILIKE ${"%" + query + "%"}
      LIMIT 20
    `,
  ]);
  const vector = `[${embedding.join(",")}]`;

  const rows = await db.$queryRaw<(SearchResult & { distance: number })[]>`
    SELECT
      b.id, b.type, b.content, b."threadId",
      t.title AS "threadTitle", t.status AS "threadStatus",
      b.embedding <=> ${Prisma.raw(`'${vector}'`)}::vector AS distance
    FROM "Bead" b
    JOIN "Thread" t ON t.id = b."threadId"
    WHERE t."userId" = ${user.id}
      AND b.embedding IS NOT NULL
      AND b.type NOT IN ('_placeholder')
    ORDER BY distance ASC
    LIMIT 20
  `;

  // Drop weak semantic matches, then keep best bead per thread
  const DISTANCE_THRESHOLD = 0.6;
  const seen = new Set<string>();
  const semanticResults: SearchResult[] = rows
    .filter((r) => r.distance < DISTANCE_THRESHOLD)
    .filter((r) => {
      if (seen.has(r.threadId)) return false;
      seen.add(r.threadId);
      return true;
    });

  // Merge in text matches (bead content + thread title) not already covered
  // for (const r of contentMatches) {
  //   if (!seen.has(r.threadId)) {
  //     seen.add(r.threadId);
  //     semanticResults.push(r);
  //   }
  // }

  const titleResults: SearchResult[] = titleMatches
    .filter((t) => !seen.has(t.id))
    .map((t) => ({
      id: t.id,
      type: "thread",
      content: {},
      threadId: t.id,
      threadTitle: t.title,
      threadStatus: t.status,
    }));

  return [...semanticResults, ...titleResults];
}
