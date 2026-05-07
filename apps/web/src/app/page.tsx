import { PublicLayout } from '@/components/layouts/PublicLayout'

export default function Home() {
  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Home</h1>
        <p className="text-muted-foreground mt-2">Welcome to the public homepage.</p>
      </div>
    </PublicLayout>
  )
}
