import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { assertTenantMembership, fetchChapter, fetchClassroom, fetchSubject } from '@/lib/actions/quizzes'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'

type PageProps = {
  params: {
    classroomId: string
    subjectId: string
    chapterId: string
  }
}

type QuizListRow = {
  id: string
  title: string
  is_published: boolean
  created_at: string
}

export default async function ChapterQuizzesPage({ params }: PageProps) {
  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const chapter = await fetchChapter(client, params.chapterId)
  const subject = await fetchSubject(client, chapter.subject_id)
  const classroom = await fetchClassroom(client, subject.classroom_id)

  if (subject.id !== params.subjectId) throw new Error('Subject not found for chapter')
  if (classroom.id !== params.classroomId) throw new Error('Classroom not found for subject')

  await assertTenantMembership(client, classroom.tenant_id, user.id)

  const { data, error } = await client
    .from('quizzes')
    .select('id, title, is_published, created_at')
    .eq('chapter_id', chapter.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const quizzes = (data ?? []) as QuizListRow[]

  return (
    <main className="max-w-5xl mx-auto space-y-6 p-6">
      <Breadcrumbs
        items={[
          { label: 'Classrooms', href: '/classrooms' },
          { label: classroom.title, href: `/classrooms/${params.classroomId}/subjects` },
          {
            label: subject.name,
            href: `/classrooms/${params.classroomId}/subjects/${params.subjectId}/chapters`,
          },
          { label: chapter.title },
          { label: 'Quizzes' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Quizzes</h1>
          <p className="text-sm text-gray-600">
            Manage quizzes for this chapter. Create assessments to reinforce learning.
          </p>
        </div>
        <Link
          href={`/classrooms/${params.classroomId}/subjects/${params.subjectId}/chapters/${params.chapterId}/quizzes/new`}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
        >
          New Quiz
        </Link>
      </div>

      <section className="space-y-3">
        {quizzes.length === 0 ? (
          <p className="text-sm text-gray-600">No quizzes yet. Create one to get started.</p>
        ) : (
          <ul className="space-y-3">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium">{quiz.title}</h2>
                    <p className="text-xs text-gray-500">
                      {quiz.is_published ? 'Published' : 'Draft'} ·{' '}
                      {new Date(quiz.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/classrooms/${params.classroomId}/subjects/${params.subjectId}/chapters/${params.chapterId}/quizzes/${quiz.id}`}
                    className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
