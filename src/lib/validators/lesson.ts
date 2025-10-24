import { z } from '@/vendor/zod'

export const lessonTypeEnum = z.enum(['video', 'pdf', 'quiz', 'assignment'])

export const upsertLessonSchema = z.object({
  id: z.string().uuid().optional(),
  subjectId: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z
    .string()
    .transform((val) => (val.trim() === '' ? undefined : val))
    .optional(),
  type: lessonTypeEnum,
  duration: z
    .string()
    .optional(),
  videoUrl: z
    .string()
    .transform((val) => (val.trim() === '' ? undefined : val))
    .optional(),
  isFreePreview: z.literal('on').optional(),
})

export const reorderLessonsSchema = z.object({
  subjectId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1),
})
