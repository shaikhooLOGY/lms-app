import { getViewMode } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function UserDashboardPage() {
  const mode = await getViewMode()

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Learner dashboard</h1>
        <p className="text-sm text-gray-600">
          This area will surface classrooms, progress, and notifications tailored to the learner experience.
        </p>
      </header>
      <section className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
        <p>
          Current view mode: <span className="font-medium">{mode}</span>. Additional learner-focused widgets will be
          connected in upcoming iterations.
        </p>
      </section>
    </main>
  )
}
