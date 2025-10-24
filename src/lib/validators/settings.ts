import { z } from '@/vendor/zod'

export const brandingSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(2, 'Institute name must be at least 2 characters long'),
  logoUrl: z
    .string()
    .transform((val) => (val.trim() === '' ? undefined : val))
    .optional(),
  primaryColor: z
    .string()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Invalid hex color')
    .optional(),
})

export const enrollmentRulesSchema = z.object({
  tenantId: z.string().uuid(),
  autoApprove: z.literal('on').optional(),
  requireReason: z.literal('on').optional(),
})

export const notificationsSchema = z.object({
  tenantId: z.string().uuid(),
  emailDigest: z.literal('on').optional(),
  slackHook: z
    .string()
    .transform((val) => (val.trim() === '' ? undefined : val))
    .optional(),
})

export const rolesSchema = z.object({
  tenantId: z.string().uuid(),
  defaultRole: z.enum(['student', 'teacher']),
  allowSelfUpgrade: z.literal('on').optional(),
})
