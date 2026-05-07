import { AppLayout } from '@/components/layouts/AppLayout'
import { getThreads } from '@/lib/actions/threads'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const threads = await getThreads()
  return <AppLayout threads={threads}>{children}</AppLayout>
}
