import { z } from '@/vendor/zod'

export const classroomStatusEnum = z.enum([
  'draft',
  'pending_review',
  'published',
  'rejected',
  'banned',
])

export const upsertClassroomSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z
    .string()
    .transform((val) => (val.trim() === '' ? undefined : val))
    .optional(),
  capacity: z.string().optional(),
  educatorId: z.string().uuid().optional(),
  status: classroomStatusEnum.optional(),
})

export const classroomStatusSchema = z.object({
  classroomId: z.string().uuid(),
  status: classroomStatusEnum,
})
