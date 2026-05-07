import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardTaskRow } from "@/components/DashboardTaskRow";

export default async function DashboardPage() {
  const session = await auth();

  let tasks: {
    id: string;
    content: unknown;
    thread: { id: string; title: string };
  }[] = [];

  if (session?.user?.email) {
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (user) {
      const allTasks = await db.bead.findMany({
        where: {
          type: "task",
          thread: { userId: user.id, status: "active" },
        },
        select: {
          id: true,
          content: true,
          thread: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      tasks = allTasks.filter((t) => !(t.content as { done?: boolean }).done);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {tasks.length === 0 ? (
        <p className="text-muted-foreground mt-4">No open tasks.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Open tasks
          </h2>
          {tasks.map((task) => {
            const content = task.content as { title: string; due_at: string | null; done: boolean };
            return (
              <DashboardTaskRow
                key={task.id}
                beadId={task.id}
                title={content.title}
                dueAt={content.due_at}
                threadId={task.thread.id}
                threadTitle={task.thread.title}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
