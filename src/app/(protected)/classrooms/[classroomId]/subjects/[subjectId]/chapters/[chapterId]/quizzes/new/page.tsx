import { redirect } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import { createQuiz, assertTenantMembership, fetchChapter, fetchClassroom, fetchSubject } from '@/lib/actions/quizzes'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'

type PageProps = {
  params: {
    classroomId: string
    subjectId: string
    chapterId: string
  }
}

export default async function NewQuizPage({ params }: PageProps) {
  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const chapter = await fetchChapter(client, params.chapterId)
  const subject = await fetchSubject(client, chapter.subject_id)
  const classroom = await fetchClassroom(client, subject.classroom_id)

  if (subject.id !== params.subjectId) throw new Error('Subject not found for chapter')
  if (classroom.id !== params.classroomId) throw new Error('Classroom not found for subject')

  await assertTenantMembership(client, classroom.tenant_id, user.id)

  async function handleCreateQuiz(formData: FormData) {
    'use server'
    const title = formData.get('title')?.toString().trim()
    const description = formData.get('description')?.toString().trim()

    if (!title) throw new Error('Title is required')

    await createQuiz({
      classroomId: params.classroomId,
      subjectId: params.subjectId,
      chapterId: params.chapterId,
      title,
      description: description || null,
    })

    redirect(`/classrooms/${params.classroomId}/subjects/${params.subjectId}/chapters/${params.chapterId}/quizzes`)
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
          { label: chapter.title, href: `/classrooms/${params.classroomId}/subjects/${params.subjectId}/chapters/${params.chapterId}/quizzes` },
          { label: 'New Quiz' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold">Create Quiz</h1>
        <p className="text-sm text-gray-600">
          Draft a quiz for this chapter. You can add questions after creating the quiz.
        </p>
      </div>

      <form action={handleCreateQuiz} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium">
          Title
          <input
            name="title"
            type="text"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Midterm Quiz"
          />
        </label>

        <label className="block text-sm font-medium">
          Description <span className="font-normal text-gray-500">(optional)</span>
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Topics covered and key notes for this quiz."
          />
        </label>

        <button
          type="submit"
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
        >
          Create Quiz
        </button>
      </form>
    </main>
  )
}
