'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { createServiceClient, getAuthenticatedUser } from './supabaseServer'
import { findTenantByHost } from '@/lib/tenant'

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

    const cookieStore = await cookies()
    let tenantId = cookieStore.get('tenant_id')?.value ?? null

    if (!tenantId) {
      const host = (await headers()).get('host') ?? ''
      tenantId = (await findTenantByHost(host))?.tenant_id ?? null
    }

    if (!tenantId) return { error: 'Tenant context missing. Please refresh and try again.' }

    const { data: membership, error: membershipError } = await client
      .from('tenant_members')
      .select('tenant_id, role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError) throw new Error(membershipError.message)
    if (!membership) return { error: 'You are not authorized to create classrooms for this tenant.' }

    const allowedRoles = new Set(['teacher', 'admin', 'owner'])
    if (!allowedRoles.has((membership.role ?? '').toLowerCase())) {
      return { error: 'Only institute admins can create classrooms.' }
    }

    const { error } = await client.from('classrooms').insert([
      {
        tenant_id: tenantId,
        title,
        description: description || null,
      },
    ])

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard')
    revalidatePath('/classrooms')

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create classroom'
    return { error: message }
  }
}
