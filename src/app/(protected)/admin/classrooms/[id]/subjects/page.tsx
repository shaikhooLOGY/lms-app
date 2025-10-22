import Link from 'next/link'
import { AdminOnly } from '@/components/Guard'

export const dynamic = 'force-dynamic'

type PageParams = {
  id: string
}

export default async function AdminClassroomSubjectsPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { id } = await params

  const content = await AdminOnly({
    children: (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Subjects in classroom {id}</h1>
          <p className="text-sm text-gray-600">
            Reorder subjects, publish outlines, and drill into chapters from this administrative view.
          </p>
        </header>
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          <p>Subject listing and drag-and-drop ordering will be hooked up in the subjects CRUD sprint milestone.</p>
        </section>
        <div className="flex items-center gap-3">
          <Link href={`/admin/classrooms/${id}/edit`} className="text-sm font-medium text-blue-600 hover:underline">
            Back to classroom
          </Link>
          <Link
            href="/admin/classrooms/subjects/demo/chapters"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Example chapters view
          </Link>
        </div>
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Access restricted</h1>
        <p className="text-sm text-gray-600">You need administrative permissions to manage subjects.</p>
      </main>
    )
  }

  return content
}
