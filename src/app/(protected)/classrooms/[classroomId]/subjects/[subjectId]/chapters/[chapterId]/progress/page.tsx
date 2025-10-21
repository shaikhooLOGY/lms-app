import { redirect } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import { markChapterProgress, assertTenantMembership, fetchChapter, fetchClassroom, fetchSubject } from '@/lib/actions/quizzes'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'

type PageProps = {
  params: {
    classroomId: string
    subjectId: string
    chapterId: string
  }
}

type ProgressRow = {
  status: string
  last_viewed_at: string | null
  updated_at: string
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
}

export default async function ChapterProgressPage({ params }: PageProps) {
  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const chapter = await fetchChapter(client, params.chapterId)
  const subject = await fetchSubject(client, chapter.subject_id)
  const classroom = await fetchClassroom(client, subject.classroom_id)

  if (subject.id !== params.subjectId) throw new Error('Subject mismatch')
  if (classroom.id !== params.classroomId) throw new Error('Classroom mismatch')

  await assertTenantMembership(client, classroom.tenant_id, user.id)

  const { data, error } = await client
    .from('user_chapter_progress')
    .select('status, last_viewed_at, updated_at')
    .eq('chapter_id', chapter.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)

  const progress = data as ProgressRow | null
  const currentStatus = progress?.status ?? 'not_started'
  const currentPath = `/classrooms/${params.classroomId}/subjects/${params.subjectId}/chapters/${params.chapterId}/progress`

  async function updateStatus(formData: FormData) {
    'use server'
    const status = formData.get('status')?.toString()
    if (!status) throw new Error('Status is required')

    await markChapterProgress({
      classroomId: params.classroomId,
      subjectId: params.subjectId,
      chapterId: params.chapterId,
      status: status as 'not_started' | 'in_progress' | 'completed',
    })

    redirect(currentPath)
  }

  return (
    <main className="max-w-3xl mx-auto space-y-6 p-6">
      <Breadcrumbs
        items={[
          { label: 'Classrooms', href: '/classrooms' },
          { label: classroom.title, href: `/classrooms/${params.classroomId}/subjects` },
          {
            label: subject.name,
            href: `/classrooms/${params.classroomId}/subjects/${params.subjectId}/chapters`,
          },
          {
            label: chapter.title,
            href: `/classrooms/${params.classroomId}/subjects/${params.subjectId}/chapters/${params.chapterId}/quizzes`,
          },
          { label: 'Progress' },
        ]}
      />
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Chapter Progress</h1>
        <p className="text-sm text-gray-600">
          Track your personal progress for this chapter. Update the status as you work through the material.
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="font-medium text-gray-600">Current status</dt>
            <dd className="font-semibold text-gray-800">{STATUS_LABELS[currentStatus] ?? 'Not started'}</dd>
          </div>
          {progress?.last_viewed_at && (
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600">Last viewed</dt>
              <dd>{new Date(progress.last_viewed_at).toLocaleString()}</dd>
            </div>
          )}
          {progress?.updated_at && (
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600">Updated</dt>
              <dd>{new Date(progress.updated_at).toLocaleString()}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">Update status</h2>
        <form action={updateStatus} className="mt-4 flex flex-wrap gap-3">
          {(['not_started', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              type="submit"
              name="status"
              value={status}
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
            >
              Mark as {STATUS_LABELS[status]}
            </button>
          ))}
        </form>
      </section>
    </main>
  )
}
