import { z } from '@/vendor/zod'

export const tenantStatusEnum = z.enum([
  'active',
  'pending_review',
  'suspended',
  'banned',
  'inactive',
])

export const upsertTenantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,40}$/, 'Subdomain must be lowercase and alphanumeric (hyphens allowed)')
    .optional(),
  status: tenantStatusEnum.optional(),
})

export const tenantStatusSchema = z.object({
  tenantId: z.string().uuid(),
  status: tenantStatusEnum,
})
