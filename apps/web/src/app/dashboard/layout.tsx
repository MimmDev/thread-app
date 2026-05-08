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
      threads = await db.thread.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true },
      });
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
