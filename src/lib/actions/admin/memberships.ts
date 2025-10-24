'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'
import { resolveAdminTenantContext } from '@/lib/actions/classrooms'
import { logActivity } from './activity'
import { z } from '@/vendor/zod'

const memberRoleEnum = z.enum(['owner', 'admin', 'teacher', 'student', 'banned'])

const updateMemberSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  role: memberRoleEnum,
})

const removeMemberSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
})

export type AdminMemberRecord = {
  user_id: string
  email: string | null
  full_name: string | null
  role: string
  joined_at: string | null
}

export async function listMembersByRole(role: 'educators' | 'students' | string) {
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  if (!tenantId) return []

  const rolesToFetch =
    role === 'educators' ? ['owner', 'admin', 'teacher'] : role === 'students' ? ['student'] : [role]

  const { data, error } = await client
    .from('tenant_members')
    .select('user_id, role, created_at, profiles ( email, full_name )')
    .eq('tenant_id', tenantId)
    .in('role', rolesToFetch)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      user_id: row.user_id,
      email: profile?.email ?? null,
      full_name: profile?.full_name ?? null,
      role: row.role,
      joined_at: row.created_at,
    }
  }) as AdminMemberRecord[]
}

export async function updateMemberRoleAction(formData: FormData) {
  const payload = updateMemberSchema.safeParse({
    tenantId: formData.get('tenantId')?.toString(),
    userId: formData.get('userId')?.toString(),
    role: formData.get('role')?.toString(),
  })

  if (!payload.success) {
    return { error: payload.error.issues[0]?.message ?? 'Invalid payload' }
  }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId } = await resolveAdminTenantContext(client, user.id)

    if (!tenantId || tenantId !== payload.data.tenantId) {
      return { error: 'Tenant mismatch. Select an institute first.' }
    }

    const { error } = await client
      .from('tenant_members')
      .update({ role: payload.data.role })
      .eq('tenant_id', payload.data.tenantId)
      .eq('user_id', payload.data.userId)

    if (error) throw error

    await client
      .from('memberships')
      .upsert({ tenant_id: payload.data.tenantId, user_id: payload.data.userId, role: payload.data.role })

    await logActivity({
      entityType: 'membership',
      entityId: payload.data.userId,
      action: 'role_updated',
      meta: {
        tenantId: payload.data.tenantId,
        role: payload.data.role,
      },
    })

    revalidatePath('/admin/educators')
    revalidatePath('/admin/students')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update member'
    return { error: message }
  }
}

export async function removeMemberAction(formData: FormData) {
  const payload = removeMemberSchema.safeParse({
    tenantId: formData.get('tenantId')?.toString(),
    userId: formData.get('userId')?.toString(),
  })

  if (!payload.success) {
    return { error: payload.error.issues[0]?.message ?? 'Invalid payload' }
  }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId } = await resolveAdminTenantContext(client, user.id)

    if (!tenantId || tenantId !== payload.data.tenantId) {
      return { error: 'Tenant mismatch. Select an institute first.' }
    }

    await client
      .from('tenant_members')
      .delete()
      .eq('tenant_id', payload.data.tenantId)
      .eq('user_id', payload.data.userId)

    await client
      .from('memberships')
      .delete()
      .eq('tenant_id', payload.data.tenantId)
      .eq('user_id', payload.data.userId)

    await logActivity({
      entityType: 'membership',
      entityId: payload.data.userId,
      action: 'removed',
      meta: { tenantId: payload.data.tenantId },
    })

    revalidatePath('/admin/educators')
    revalidatePath('/admin/students')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to remove member'
    return { error: message }
  }
}
