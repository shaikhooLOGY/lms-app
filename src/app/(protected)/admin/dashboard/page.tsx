import { AdminOnly } from '@/components/Guard'
import { requireSession } from '@/lib/auth/requireSession'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  await requireSession('/admin/dashboard')
  const content = await AdminOnly({
    children: (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Admin control center</h1>
          <p className="text-sm text-gray-600">
            Overview of institute-wide activity, pending enrollments, and quick links for superadmins and staff.
          </p>
        </header>
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
            <h2 className="text-base font-semibold text-gray-900">Next steps</h2>
            <ul className="mt-3 space-y-2 list-disc pl-4">
              <li>Wire dashboard metrics once enrollment and classroom stats are available.</li>
              <li>Surface alerts for pending approvals and flagged content.</li>
            </ul>
          </article>
          <article className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
            <h2 className="text-base font-semibold text-gray-900">Quick navigation</h2>
            <p>Use the left sidebar to manage classrooms, subjects, chapters, and enrollment approvals.</p>
          </article>
        </section>
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Access restricted</h1>
        <p className="text-sm text-gray-600">
          You need administrative permissions and admin view enabled to access this area.
        </p>
      </main>
    )
  }

  return content
}
