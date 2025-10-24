'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'
import { logActivity } from './activity'
import { resolveAdminTenantContext } from '@/lib/actions/classrooms'
import { z } from '@/vendor/zod'

export type ApprovalRecord = {
  id: string
  entity_type: string
  entity_id: string
  status: string
  reason: string | null
  created_at: string
  meta: Record<string, unknown> | null
}

const approvalDecisionSchema = z.object({
  approvalId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  reason: z
    .string()
    .transform((val) => (val.trim() === '' ? undefined : val))
    .optional(),
})

export async function listPendingApprovals() {
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  if (!tenantId) return []

  const { data, error } = await client
    .from('approvals')
    .select('id, entity_type, entity_id, status, reason, meta, created_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ApprovalRecord[]
}

export async function decideApprovalAction(formData: FormData) {
  const parsed = approvalDecisionSchema.safeParse({
    approvalId: formData.get('approvalId')?.toString(),
    decision: formData.get('decision')?.toString(),
    reason: formData.get('reason')?.toString(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid decision payload' }
  }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId } = await resolveAdminTenantContext(client, user.id)

    if (!tenantId) return { error: 'Select an institute before moderating approvals.' }

    const { data, error } = await client
      .from('approvals')
      .update({
        status: parsed.data.decision,
        reason: parsed.data.reason ?? null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.approvalId)
      .eq('tenant_id', tenantId)
      .select('entity_type, entity_id')
      .single()

    if (error || !data) throw error ?? new Error('Approval not found')

    await logActivity({
      entityType: 'approval',
      entityId: parsed.data.approvalId,
      action: parsed.data.decision,
      meta: {
        tenantId,
        entityType: data.entity_type,
        entityId: data.entity_id,
        reason: parsed.data.reason ?? null,
      },
    })

    revalidatePath('/admin/approvals')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update approval'
    return { error: message }
  }
}
