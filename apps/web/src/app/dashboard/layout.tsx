import { AppLayout } from "@/components/layouts/AppLayout";
import { ThreadList } from "@/components/ThreadList";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: Promise<{ threadId?: string }>;
}) {
  const session = await auth();
  const resolvedParams = await params;
  const activeThreadId = resolvedParams?.threadId;

  let threads: { id: string; title: string; status: string }[] = [];

  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    if (user) {
      threads = await db.thread.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true },
      });
    }
  }

  return (
    <AppLayout
      sidebarContent={
        <ThreadList threads={threads} activeThreadId={activeThreadId} />
      }
    >
      {children}
    </AppLayout>
  );
}
