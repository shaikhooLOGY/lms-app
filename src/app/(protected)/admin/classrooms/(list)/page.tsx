import Link from 'next/link'
import { AdminOnly } from '@/components/Guard'

export const dynamic = 'force-dynamic'

export default async function AdminClassroomsListPage() {
  const content = await AdminOnly({
    children: (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Manage classrooms</h1>
            <p className="text-sm text-gray-600">Create, update, publish, or archive classrooms for this tenant.</p>
          </div>
          <Link
            href="/admin/classrooms/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Create classroom
          </Link>
        </header>
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          <p>
            Classroom listings with filters, status tags, and inline actions will appear here once the CRUD logic is
            wired in.
          </p>
        </section>
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Access restricted</h1>
        <p className="text-sm text-gray-600">You need administrative permissions to manage classrooms.</p>
      </main>
    )
  }

  return content
}
