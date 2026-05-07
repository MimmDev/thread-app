import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ThreadHeader } from "@/components/ThreadHeader";
import { ThreadView } from "@/components/ThreadView";
import { getBeads } from "@/lib/actions/beads";

type Props = {
  params: Promise<{ threadId: string }>;
};

export default async function ThreadPage({ params }: Props) {
  const { threadId } = await params;
  const session = await auth();
  if (!session?.user?.email) return notFound();

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return notFound();

  const thread = await db.thread.findUnique({ where: { id: threadId, userId: user.id } });
  if (!thread) return notFound();

  const beads = await getBeads(threadId);

  return (
    <div className="flex flex-col flex-1">
      <ThreadHeader thread={thread} />
      <ThreadView threadId={threadId} initialBeads={beads} />
    </div>
  );
}
