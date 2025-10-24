import { AdminOnly } from '@/components/Guard'
import { requireSession } from '@/lib/auth/requireSession'

export const dynamic = 'force-dynamic'

export default async function AdminEnrollmentsPage() {
  await requireSession('/admin/enrollments')
  const content = await AdminOnly({
    children: (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Enrollment approvals</h1>
          <p className="text-sm text-gray-600">
            Review and approve learner enrollment requests before they gain access to classroom content.
          </p>
        </header>
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          <p>Pending enrollment queue, approval controls, and history logs will be implemented in this view.</p>
        </section>
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Access restricted</h1>
        <p className="text-sm text-gray-600">You need administrative permissions to moderate enrollments.</p>
      </main>
    )
  }

  return content
}
