import Link from 'next/link'

export const dynamic = 'force-dynamic'

type PageParams = {
  classroomId: string
}

export default async function UserClassroomLearnPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { classroomId } = await params

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Classroom {classroomId}</h1>
        <p className="text-sm text-gray-600">
          Learners will consume lessons, track completion, and unlock content here.
        </p>
      </header>
      <section className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
        <p className="mb-4">
          Content delivery (subjects, chapters, progress tracking) will be wired in later sprint tasks.
        </p>
        <Link
          href="/user/dashboard"
          className="inline-flex items-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
        >
          Back to learner dashboard
        </Link>
      </section>
    </main>
  )
}
