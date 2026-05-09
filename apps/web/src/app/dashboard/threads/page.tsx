import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ThreadsClient } from "./ThreadsClient";

export default async function ThreadsPage() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return null;

  const threads = await db.thread.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-6 py-6 overflow-y-auto flex-1">
      <ThreadsClient threads={threads} />
    </div>
  );
}
