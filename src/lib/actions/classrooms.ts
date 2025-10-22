'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServiceClient, getAuthenticatedUser } from './supabaseServer'
import { getIsSuperAdmin } from '@/lib/permissions'

const ADMIN_ROLES = new Set(['owner', 'admin', 'teacher'])

type TenantContext = {
  tenantId: string | null
  role: string | null
}

export async function resolveAdminTenantContext(
  client = createServiceClient(),
  userId?: string
): Promise<TenantContext> {
  const cookieStore = await cookies()
  let subjectUserId: string | null | undefined = userId

  const cookieTenant = cookieStore.get('tenant_id')?.value ?? null

  if (!subjectUserId) {
    const accessToken = cookieStore.get('sb-access-token')?.value
    if (!accessToken) {
      return { tenantId: null, role: null }
    }

    const { data: userData } = await client.auth.getUser(accessToken)
    subjectUserId = userData?.user?.id ?? null
    if (!subjectUserId) {
      return { tenantId: null, role: null }
    }
  }

  if (!subjectUserId) {
    return { tenantId: null, role: null }
  }

  const { data: memberships } = await client
    .from('tenant_members')
    .select('tenant_id, role')
    .eq('user_id', subjectUserId)
    .in('role', Array.from(ADMIN_ROLES))

  const membership = memberships?.find((m) => m.tenant_id === cookieTenant) ?? memberships?.[0] ?? null
  const tenantId = cookieTenant ?? membership?.tenant_id ?? null
  const role = membership?.role ?? null

  return { tenantId, role }
}

export type ClassroomFormState = {
  error?: string
  success?: boolean
}

export async function createClassroomAction(
  _prevState: ClassroomFormState,
  formData: FormData
): Promise<ClassroomFormState> {
  try {
    const title = formData.get('title')?.toString().trim()
    const description = formData.get('description')?.toString().trim() ?? ''

    if (!title) return { error: 'Title is required' }

    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId, role } = await resolveAdminTenantContext(client, user.id)
    const isSuperAdmin = await getIsSuperAdmin()

    if (!tenantId) {
      return {
        error: isSuperAdmin
          ? 'Select an institute before creating a classroom.'
          : 'Tenant context missing. Please refresh and try again.',
      }
    }

    if (!isSuperAdmin) {
      if (!role) return { error: 'You are not authorized to create classrooms for this tenant.' }
      if (!ADMIN_ROLES.has(role.toLowerCase())) {
        return { error: 'Only institute admins can create classrooms.' }
      }
    }

    const { error } = await client.from('classrooms').insert([
      {
        tenant_id: tenantId,
        title,
        description: description || null,
        status: 'draft',
      },
    ])

    if (error) throw new Error(error.message)

    revalidatePath('/admin/classrooms')
    redirect('/admin/classrooms?status=created')

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create classroom'
    return { error: message }
  }
}
