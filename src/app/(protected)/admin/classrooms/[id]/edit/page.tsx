import Link from 'next/link'
import { AdminOnly } from '@/components/Guard'

export const dynamic = 'force-dynamic'

type PageParams = {
  id: string
}

export default async function AdminClassroomEditPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { id } = await params

  const content = await AdminOnly({
    children: (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Edit classroom</h1>
          <p className="text-sm text-gray-600">
            Update metadata, manage status, and review enrollment stats for classroom <code>{id}</code>.
          </p>
        </header>
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          <p>Form controls and history logs will be surfaced after the updateClassroom action is implemented.</p>
        </section>
        <div className="flex items-center gap-3">
          <Link href="/admin/classrooms" className="text-sm font-medium text-blue-600 hover:underline">
            Back to classrooms
          </Link>
          <Link
            href={`/admin/classrooms/${id}/subjects`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Manage subjects
          </Link>
        </div>
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Access restricted</h1>
        <p className="text-sm text-gray-600">You need administrative permissions to edit classrooms.</p>
      </main>
    )
  }

  return content
}
