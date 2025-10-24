import { z } from '@/vendor/zod'

export const subjectStatusEnum = z.enum([
  'draft',
  'published',
  'archived',
])

export const upsertSubjectSchema = z.object({
  id: z.string().uuid().optional(),
  classroomId: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z
    .string()
    .transform((val) => (val.trim() === '' ? undefined : val))
    .optional(),
  status: subjectStatusEnum.optional(),
})

export const reorderSubjectsSchema = z.object({
  classroomId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1),
})
