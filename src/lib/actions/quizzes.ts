'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient, getAuthenticatedUser } from './supabaseServer'

type QuestionType = 'mcq_single' | 'mcq_multi' | 'true_false' | 'short_text'
type ChapterProgressStatus = 'not_started' | 'in_progress' | 'completed'

type CreateQuizArgs = {
  classroomId: string
  subjectId: string
  chapterId: string
  title: string
  description?: string | null
}

type AddQuestionArgs = {
  quizId: string
  type: QuestionType
  prompt: string
  explanation?: string | null
}

type AddQuestionOptionArgs = {
  questionId: string
  label: string
  isCorrect?: boolean
  orderIndex?: number
}

type StartAttemptArgs = {
  quizId: string
}

type SubmitAttemptAnswer = {
  questionId: string
  optionId?: string | null
  freeText?: string | null
}

type SubmitAttemptArgs = {
  attemptId: string
  answers: SubmitAttemptAnswer[]
}

type MarkChapterProgressArgs = {
  classroomId: string
  subjectId: string
  chapterId: string
  status: ChapterProgressStatus
}

type ChapterRow = {
  id: string
  subject_id: string
  tenant_id: string
  title: string
}

type SubjectRow = {
  id: string
  classroom_id: string
  tenant_id: string
  name: string
}

type ClassroomRow = {
  id: string
  tenant_id: string
  title: string
}

type QuizRow = {
  id: string
  tenant_id: string
  chapter_id: string
  subject_id: string
  classroom_id: string
}

type QuestionRow = {
  id: string
  quiz_id: string
  tenant_id: string
  type: QuestionType
}

type QuestionOptionRow = {
  id: string
  question_id: string
  tenant_id: string
  is_correct: boolean
}

type AttemptRow = {
  id: string
  quiz_id: string
  tenant_id: string
  user_id: string
}

export async function assertTenantMembership(client = createServiceClient(), tenantId: string, userId: string) {
  const { data, error } = await client
    .from('tenant_members')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Not authorized for tenant')
}

export async function fetchChapter(client = createServiceClient(), chapterId: string): Promise<ChapterRow> {
  const { data, error } = await client
    .from('chapters')
    .select('id, subject_id, tenant_id, title')
    .eq('id', chapterId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Chapter not found')
  return data as ChapterRow
}

export async function fetchSubject(client = createServiceClient(), subjectId: string): Promise<SubjectRow> {
  const { data, error } = await client
    .from('subjects')
    .select('id, classroom_id, tenant_id, name')
    .eq('id', subjectId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Subject not found')
  return data as SubjectRow
}

export async function fetchClassroom(client = createServiceClient(), classroomId: string): Promise<ClassroomRow> {
  const { data, error } = await client
    .from('classrooms')
    .select('id, tenant_id, title')
    .eq('id', classroomId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Classroom not found')
  return data as ClassroomRow
}

export async function fetchQuiz(client = createServiceClient(), quizId: string): Promise<QuizRow> {
  const { data, error } = await client
    .from('quizzes')
    .select('id, tenant_id, chapter_id, subject_id, classroom_id')
    .eq('id', quizId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Quiz not found')
  return data as QuizRow
}

async function fetchQuestion(client = createServiceClient(), questionId: string): Promise<QuestionRow> {
  const { data, error } = await client
    .from('questions')
    .select('id, quiz_id, tenant_id, type')
    .eq('id', questionId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Question not found')
  return data as QuestionRow
}

async function fetchAttempt(client = createServiceClient(), attemptId: string): Promise<AttemptRow> {
  const { data, error } = await client
    .from('user_quiz_attempts')
    .select('id, quiz_id, tenant_id, user_id')
    .eq('id', attemptId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Quiz attempt not found')
  return data as AttemptRow
}

export async function createQuiz(args: CreateQuizArgs) {
  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const chapter = await fetchChapter(client, args.chapterId)
  const subject = await fetchSubject(client, chapter.subject_id)
  const classroom = await fetchClassroom(client, subject.classroom_id)

  if (args.subjectId !== subject.id) throw new Error('Subject mismatch')
  if (args.classroomId !== classroom.id) throw new Error('Classroom mismatch')

  await assertTenantMembership(client, classroom.tenant_id, user.id)

  const insertPayload = {
    title: args.title.trim(),
    description: args.description?.trim() ?? null,
    chapter_id: chapter.id,
    subject_id: subject.id,
    classroom_id: classroom.id,
  }

  const { data, error } = await client
    .from('quizzes')
    .insert([insertPayload])
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/classrooms/${classroom.id}/subjects/${subject.id}/chapters/${chapter.id}/quizzes`)
  return data
}

export async function addQuestion(args: AddQuestionArgs) {
  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const quiz = await fetchQuiz(client, args.quizId)
  await assertTenantMembership(client, quiz.tenant_id, user.id)

  const allowedTypes: QuestionType[] = ['mcq_single', 'mcq_multi', 'true_false', 'short_text']
  if (!allowedTypes.includes(args.type)) {
    throw new Error('Unsupported question type')
  }

  const { data, error } = await client
    .from('questions')
    .insert([{
      quiz_id: quiz.id,
      type: args.type,
      prompt: args.prompt.trim(),
      explanation: args.explanation?.trim() ?? null,
    }])
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/classrooms/${quiz.classroom_id}/subjects/${quiz.subject_id}/chapters/${quiz.chapter_id}/quizzes/${quiz.id}`)
  return data
}

export async function addQuestionOption(args: AddQuestionOptionArgs) {
  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const question = await fetchQuestion(client, args.questionId)
  const quiz = await fetchQuiz(client, question.quiz_id)
  await assertTenantMembership(client, quiz.tenant_id, user.id)

  const { data, error } = await client
    .from('question_options')
    .insert([{
      question_id: question.id,
      label: args.label.trim(),
      is_correct: Boolean(args.isCorrect),
      order_index: args.orderIndex ?? 0,
    }])
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/classrooms/${quiz.classroom_id}/subjects/${quiz.subject_id}/chapters/${quiz.chapter_id}/quizzes/${quiz.id}`)
  return data
}

export async function startAttempt(args: StartAttemptArgs) {
  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const quiz = await fetchQuiz(client, args.quizId)
  await assertTenantMembership(client, quiz.tenant_id, user.id)

  const { data, error } = await client
    .from('user_quiz_attempts')
    .insert([{
      quiz_id: quiz.id,
      user_id: user.id,
      started_at: new Date().toISOString(),
    }])
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function submitAttempt(args: SubmitAttemptArgs) {
  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const attempt = await fetchAttempt(client, args.attemptId)
  if (attempt.user_id !== user.id) throw new Error('Not authorized to submit this attempt')

  await assertTenantMembership(client, attempt.tenant_id, user.id)

  const { data: questionRows, error: questionError } = await client
    .from('questions')
    .select('id, quiz_id, tenant_id, type')
    .eq('quiz_id', attempt.quiz_id)

  if (questionError) throw new Error(questionError.message)
  const questions = (questionRows ?? []) as QuestionRow[]
  const questionIds = questions.map((q) => q.id)

  const { data: optionRows, error: optionError } = await client
    .from('question_options')
    .select('id, question_id, tenant_id, is_correct')
    .in('question_id', questionIds.length > 0 ? questionIds : ['00000000-0000-0000-0000-000000000000'])

  if (optionError) throw new Error(optionError.message)
  const options = (optionRows ?? []) as QuestionOptionRow[]

  const optionById = new Map<string, QuestionOptionRow>()
  const optionsByQuestion = new Map<string, QuestionOptionRow[]>()
  options.forEach((option) => {
    optionById.set(option.id, option)
    const arr = optionsByQuestion.get(option.question_id) ?? []
    arr.push(option)
    optionsByQuestion.set(option.question_id, arr)
  })

  type ProcessedAnswer = {
    question_id: string
    option_id: string | null
    free_text: string | null
    is_correct: boolean | null
  }

  const processedAnswers = args.answers.map<ProcessedAnswer>((answer) => {
    if (!answer.questionId) throw new Error('Answer missing questionId')
    return {
      question_id: answer.questionId,
      option_id: answer.optionId ?? null,
      free_text: answer.freeText ?? null,
      is_correct: null,
    }
  })

  const answersByQuestion = new Map<string, ProcessedAnswer[]>()
  processedAnswers.forEach((answer) => {
    const existing = answersByQuestion.get(answer.question_id)
    if (existing) {
      existing.push(answer)
    } else {
      answersByQuestion.set(answer.question_id, [answer])
    }
  })

  let gradableQuestions = 0
  let correctQuestions = 0

  questions.forEach((question) => {
    const submitted = answersByQuestion.get(question.id) ?? []
    const correctOptions = (optionsByQuestion.get(question.id) ?? []).filter((opt) => opt.is_correct)
    const correctOptionIds = new Set(correctOptions.map((opt) => opt.id))

    if (question.type === 'short_text') {
      submitted.forEach((ans) => {
        ans.is_correct = null
      })
      return
    }

    if (question.type === 'mcq_multi') {
      gradableQuestions += 1
      const selectedIds = new Set(submitted.filter((ans) => ans.option_id).map((ans) => ans.option_id!))
      const expectedIds = new Set(correctOptionIds)
      const isQuestionCorrect =
        selectedIds.size === expectedIds.size &&
        [...selectedIds].every((id) => expectedIds.has(id))

      submitted.forEach((ans) => {
        ans.is_correct = ans.option_id ? expectedIds.has(ans.option_id) : false
      })

      if (isQuestionCorrect) correctQuestions += 1
      return
    }

    gradableQuestions += 1
    const answer = submitted.find((ans) => ans.option_id)
    const expected = correctOptions[0]?.id
    const isCorrect = Boolean(answer && expected && answer.option_id === expected && submitted.length === 1)

    submitted.forEach((ans) => {
      if (ans === answer) {
        ans.is_correct = isCorrect
      } else if (ans.option_id) {
        ans.is_correct = false
      } else {
        ans.is_correct = null
      }
    })

    if (isCorrect) correctQuestions += 1
  })

  const score = gradableQuestions > 0 ? Math.round((correctQuestions / gradableQuestions) * 10000) / 100 : null

  const { error: deleteError } = await client
    .from('user_quiz_answers')
    .delete()
    .eq('attempt_id', attempt.id)
  if (deleteError) throw new Error(deleteError.message)

  if (processedAnswers.length > 0) {
    const { error: insertError } = await client
      .from('user_quiz_answers')
      .insert(
        processedAnswers.map((answer) => ({
          attempt_id: attempt.id,
          question_id: answer.question_id,
          option_id: answer.option_id,
          free_text: answer.free_text,
          is_correct: answer.is_correct,
        })),
      )
    if (insertError) throw new Error(insertError.message)
  }

  const { error: updateError } = await client
    .from('user_quiz_attempts')
    .update({
      submitted_at: new Date().toISOString(),
      score,
    })
    .eq('id', attempt.id)

  if (updateError) throw new Error(updateError.message)
  return { score }
}

export async function markChapterProgress(args: MarkChapterProgressArgs) {
  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const chapter = await fetchChapter(client, args.chapterId)
  const subject = await fetchSubject(client, chapter.subject_id)
  const classroom = await fetchClassroom(client, subject.classroom_id)

  if (args.subjectId !== subject.id) throw new Error('Subject mismatch')
  if (args.classroomId !== classroom.id) throw new Error('Classroom mismatch')

  const allowedStatuses: ChapterProgressStatus[] = ['not_started', 'in_progress', 'completed']
  if (!allowedStatuses.includes(args.status)) throw new Error('Invalid status')

  await assertTenantMembership(client, classroom.tenant_id, user.id)

  const { error } = await client
    .from('user_chapter_progress')
    .upsert(
      [{
        user_id: user.id,
        classroom_id: classroom.id,
        subject_id: subject.id,
        chapter_id: chapter.id,
        status: args.status,
        last_viewed_at: new Date().toISOString(),
      }],
      { onConflict: 'user_id,chapter_id' },
    )

  if (error) throw new Error(error.message)
  revalidatePath(`/classrooms/${classroom.id}/subjects/${subject.id}/chapters/${chapter.id}/progress`)
}
