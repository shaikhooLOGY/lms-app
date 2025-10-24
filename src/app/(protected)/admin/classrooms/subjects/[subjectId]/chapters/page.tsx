import Link from 'next/link'
import { AdminOnly } from '@/components/Guard'
import { requireSession } from '@/lib/auth/requireSession'

export const dynamic = 'force-dynamic'

type PageParams = {
  subjectId: string
}

export default async function AdminSubjectChaptersPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { subjectId } = await params
  await requireSession(`/admin/classrooms/subjects/${subjectId}/chapters`)

  const content = await AdminOnly({
    children: (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Chapters for subject {subjectId}</h1>
          <p className="text-sm text-gray-600">
            Create and reorder chapters, manage content visibility, and preview learner-facing lessons.
          </p>
        </header>
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          <p>
            Chapter CRUD and ordering UI goes here. Content editor, preview, and publish workflows will hook into the
            upcoming actions.
          </p>
        </section>
        <div>
          <Link href="/admin/classrooms" className="text-sm font-medium text-blue-600 hover:underline">
            Back to classrooms
          </Link>
        </div>
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Access restricted</h1>
        <p className="text-sm text-gray-600">You need administrative permissions to manage chapters.</p>
      </main>
    )
  }

  return content
}
