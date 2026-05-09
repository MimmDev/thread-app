import { AppLayout } from "@/components/layouts/AppLayout";
import { ThreadList } from "@/components/ThreadList";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let threads: { id: string; title: string; status: string }[] = [];

  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    if (user) {
      const raw = await db.thread.findMany({
        where: { userId: user.id, status: "active" },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          beads: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
      threads = raw
        .map((t) => ({ ...t, lastActivity: t.beads[0]?.createdAt ?? t.createdAt }))
        .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    }
  }

  return (
    <AppLayout
      threads={threads}
      sidebarContent={
        <ThreadList threads={threads} />
      }
    >
      {children}
    </AppLayout>
  );
}
