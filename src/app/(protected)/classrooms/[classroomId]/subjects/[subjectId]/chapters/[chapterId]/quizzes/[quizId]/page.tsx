import { redirect } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import { addQuestion, addQuestionOption, assertTenantMembership, fetchChapter, fetchClassroom, fetchQuiz, fetchSubject } from '@/lib/actions/quizzes'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'

type PageProps = {
  params: {
    classroomId: string
    subjectId: string
    chapterId: string
    quizId: string
  }
}

type QuizDetailRow = {
  id: string
  title: string
  description: string | null
  is_published: boolean
  chapter_id: string
  subject_id: string
  classroom_id: string
}

type QuestionListRow = {
  id: string
  prompt: string
  type: string
  explanation: string | null
}

type OptionListRow = {
  id: string
  question_id: string
  label: string
  is_correct: boolean
  order_index: number
}

export default async function QuizDetailPage({ params }: PageProps) {
  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const quiz = await fetchQuiz(client, params.quizId)
  const chapter = await fetchChapter(client, params.chapterId)
  const subject = await fetchSubject(client, quiz.subject_id)
  const classroom = await fetchClassroom(client, quiz.classroom_id)

  if (params.subjectId !== subject.id || chapter.subject_id !== subject.id) throw new Error('Subject mismatch')
  if (params.classroomId !== classroom.id) throw new Error('Classroom mismatch')
  if (quiz.chapter_id !== chapter.id) throw new Error('Quiz not associated with chapter')

  await assertTenantMembership(client, classroom.tenant_id, user.id)

  const { data: quizExtra, error: quizError } = await client
    .from('quizzes')
    .select('id, title, description, is_published, chapter_id, subject_id, classroom_id')
    .eq('id', params.quizId)
    .maybeSingle()

  if (quizError) throw new Error(quizError.message)
  if (!quizExtra) throw new Error('Quiz not found')

  const quizDetail = quizExtra as QuizDetailRow

  const { data: questionRows, error: questionError } = await client
    .from('questions')
    .select('id, prompt, type, explanation')
    .eq('quiz_id', quizDetail.id)
    .order('created_at', { ascending: true })

  if (questionError) throw new Error(questionError.message)
  const questions = (questionRows ?? []) as QuestionListRow[]
  const questionIds = questions.map((q) => q.id)

  const { data: optionRows, error: optionError } = await client
    .from('question_options')
    .select('id, question_id, label, is_correct, order_index')
    .in('question_id', questionIds.length > 0 ? questionIds : ['00000000-0000-0000-0000-000000000000'])
    .order('order_index', { ascending: true })

  if (optionError) throw new Error(optionError.message)
  const options = (optionRows ?? []) as OptionListRow[]

  const optionsByQuestion = new Map<string, OptionListRow[]>()
  options.forEach((option) => {
    const arr = optionsByQuestion.get(option.question_id) ?? []
    arr.push(option)
    optionsByQuestion.set(option.question_id, arr)
  })

  const pagePath = `/classrooms/${params.classroomId}/subjects/${params.subjectId}/chapters/${params.chapterId}/quizzes/${params.quizId}`

  async function handleAddQuestion(formData: FormData) {
    'use server'
    const prompt = formData.get('prompt')?.toString().trim()
    const type = formData.get('type')?.toString() as Parameters<typeof addQuestion>[0]['type']
    const explanation = formData.get('explanation')?.toString().trim()

    if (!prompt) throw new Error('Prompt is required')
    if (!type) throw new Error('Question type is required')

    await addQuestion({
      quizId: params.quizId,
      type,
      prompt,
      explanation: explanation || null,
    })

    redirect(pagePath)
  }

  async function handleAddOption(formData: FormData) {
    'use server'
    const questionId = formData.get('questionId')?.toString()
    const label = formData.get('label')?.toString().trim()
    const isCorrect = formData.get('isCorrect') === 'on'
    const orderIndexRaw = formData.get('orderIndex')?.toString()
    const orderIndex = orderIndexRaw ? Number.parseInt(orderIndexRaw, 10) : 0

    if (!questionId) throw new Error('Question is required')
    if (!label) throw new Error('Option label is required')

    await addQuestionOption({
      questionId,
      label,
      isCorrect,
      orderIndex: Number.isNaN(orderIndex) ? 0 : orderIndex,
    })

    redirect(pagePath)
  }

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
          {
            label: chapter.title,
            href: `/classrooms/${params.classroomId}/subjects/${params.subjectId}/chapters/${params.chapterId}/quizzes`,
          },
          { label: quizDetail.title },
        ]}
      />
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{quizDetail.title}</h1>
            <p className="text-sm text-gray-600">
              {quizDetail.is_published ? 'Published' : 'Draft'} quiz for this chapter.
            </p>
          </div>
        </div>
        {quizDetail.description && (
          <p className="text-sm text-gray-600">{quizDetail.description}</p>
        )}
      </header>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">Add Question</h2>
        <form action={handleAddQuestion} className="space-y-4">
          <label className="block text-sm font-medium">
            Prompt
            <textarea
              name="prompt"
              rows={3}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Describe the question prompt."
            />
          </label>

          <label className="block text-sm font-medium">
            Type
            <select
              name="type"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              defaultValue="mcq_single"
            >
              <option value="mcq_single">Multiple choice (single answer)</option>
              <option value="mcq_multi">Multiple choice (multiple answers)</option>
              <option value="true_false">True / False</option>
              <option value="short_text">Short text</option>
            </select>
          </label>

          <label className="block text-sm font-medium">
            Explanation <span className="font-normal text-gray-500">(optional)</span>
            <textarea
              name="explanation"
              rows={2}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Explain the correct answer."
            />
          </label>

          <button
            type="submit"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Add Question
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Questions</h2>
        {questions.length === 0 ? (
          <p className="text-sm text-gray-600">No questions yet. Use the form above to add one.</p>
        ) : (
          <ol className="space-y-4">
            {questions.map((question, index) => {
              const questionOptions = optionsByQuestion.get(question.id) ?? []
              return (
                <li key={question.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">Question {index + 1}</span>
                        <span>·</span>
                        <span className="capitalize">{question.type.replace('_', ' ')}</span>
                      </div>
                      <p className="mt-2 text-base font-medium">{question.prompt}</p>
                      {question.explanation && (
                        <p className="mt-1 text-sm text-gray-600">Explanation: {question.explanation}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">Options</h3>
                    {questionOptions.length === 0 ? (
                      <p className="text-sm text-gray-500">No options yet.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {questionOptions.map((option) => (
                          <li key={option.id} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                            <span>{option.label}</span>
                            {option.is_correct && <span className="text-xs font-semibold text-green-600">Correct</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <form action={handleAddOption} className="mt-4 grid gap-3 rounded border border-dashed border-gray-300 p-4">
                    <input type="hidden" name="questionId" value={question.id} />
                    <label className="text-sm font-medium">
                      Option label
                      <input
                        name="label"
                        type="text"
                        required
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Option text"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="isCorrect" />
                      Mark as correct
                    </label>
                    <label className="text-sm font-medium">
                      Order (optional)
                      <input
                        name="orderIndex"
                        type="number"
                        className="mt-1 w-32 rounded-md border border-gray-300 px-3 py-2"
                        placeholder="0"
                      />
                    </label>
                    <button
                      type="submit"
                      className="w-fit rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
                    >
                      Add Option
                    </button>
                  </form>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </main>
  )
}
