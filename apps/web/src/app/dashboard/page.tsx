import { auth } from "@/auth";
import { db } from "@/lib/db";
import { TaskBead } from "@/components/beads/TaskBead";

type Task = {
  id: string;
  content: unknown;
  createdAt: Date;
  thread: { id: string; title: string };
};

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const ac = a.content as { due_at?: string | null };
    const bc = b.content as { due_at?: string | null };
    if (ac.due_at && bc.due_at) {
      const diff = new Date(ac.due_at).getTime() - new Date(bc.due_at).getTime();
      if (diff !== 0) return diff;
    } else if (ac.due_at) return -1;
    else if (bc.due_at) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export default async function DashboardPage() {
  const session = await auth();

  let overdue: Task[] = [];
  let open: Task[] = [];

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
          createdAt: true,
          thread: { select: { id: true, title: true } },
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pending = allTasks.filter((t) => !(t.content as { done?: boolean }).done);
      overdue = sortTasks(pending.filter((t) => {
        const due = (t.content as { due_at?: string | null }).due_at;
        return due && new Date(due) < today;
      }));
      open = sortTasks(pending.filter((t) => {
        const due = (t.content as { due_at?: string | null }).due_at;
        return !due || new Date(due) >= today;
      }));
    }
  }

  const isEmpty = overdue.length === 0 && open.length === 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {isEmpty ? (
        <p className="text-muted-foreground mt-4">No open tasks.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {overdue.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Overdue tasks
              </h2>
              {overdue.map((task) => (
                <TaskBead key={task.id} bead={task} thread={task.thread} />
              ))}
            </div>
          )}
          {open.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Open tasks
              </h2>
              {open.map((task) => (
                <TaskBead key={task.id} bead={task} thread={task.thread} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
