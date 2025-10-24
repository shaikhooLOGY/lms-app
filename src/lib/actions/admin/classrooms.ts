'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'
import { resolveAdminTenantContext } from '@/lib/actions/classrooms'
import { classroomStatusSchema, upsertClassroomSchema } from '@/lib/validators/classroom'
import { logActivity } from './activity'

export type AdminClassroomRecord = {
  id: string
  title: string
  status: string
  description: string | null
  capacity: number | null
  educator_id: string | null
  created_at: string
  tenant_id: string
}

export async function listClassrooms(search: string | null, status: string | null) {
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)

  if (!tenantId) {
    return []
  }

  const query = client
    .from('classrooms')
    .select('id, title, status, description, capacity, educator_id, created_at, tenant_id')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (search) {
    query.ilike('title', `%${search}%`)
  }
  if (status && status !== 'all') {
    query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as AdminClassroomRecord[]
}

export async function listTenantClassroomsForSelect(): Promise<Array<{ id: string; title: string }>> {
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  if (!tenantId) return []

  const { data, error } = await client
    .from('classrooms')
    .select('id, title')
    .eq('tenant_id', tenantId)
    .order('title', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({ id: row.id, title: row.title }))
}

export async function upsertClassroomAction(formData: FormData) {
  const parsed = upsertClassroomSchema.safeParse({
    id: formData.get('id')?.toString(),
    title: formData.get('title')?.toString(),
    description: formData.get('description')?.toString() ?? undefined,
    capacity: formData.get('capacity')?.toString(),
    educatorId: formData.get('educatorId')?.toString(),
    status: formData.get('status')?.toString(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid classroom payload' }
  }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId } = await resolveAdminTenantContext(client, user.id)

    if (!tenantId) {
      return { error: 'Select an institute before managing classrooms.' }
    }

    const payload = parsed.data
    const isUpdate = Boolean(payload.id)

    const capacityValue = payload.capacity && payload.capacity.trim() !== '' ? Number.parseInt(payload.capacity, 10) : null
    if (capacityValue !== null && Number.isNaN(capacityValue)) {
      return { error: 'Capacity must be a number' }
    }

    const educatorValue = payload.educatorId && payload.educatorId.trim() !== '' ? payload.educatorId : null

    const record: Record<string, unknown> = {
      title: payload.title,
      description: payload.description ?? null,
      capacity: capacityValue,
      educator_id: educatorValue,
      tenant_id: tenantId,
    }

    if (payload.status) {
      record.status = payload.status
    } else if (!isUpdate) {
      record.status = 'draft'
    }

    if (!isUpdate) {
      const { data, error } = await client
        .from('classrooms')
        .insert([record])
        .select('id')
        .single()

      if (error || !data) throw error ?? new Error('Unable to create classroom')

      await logActivity({
        entityType: 'classroom',
        entityId: data.id,
        action: 'created',
        meta: {
          tenantId,
          title: payload.title,
        },
      })
    } else {
      const { error } = await client
        .from('classrooms')
        .update(record)
        .eq('id', payload.id!)

      if (error) throw error

      await logActivity({
        entityType: 'classroom',
        entityId: payload.id!,
        action: 'updated',
        meta: {
          tenantId,
          title: payload.title,
        },
      })
    }

    revalidatePath('/admin/classrooms')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save classroom'
    return { error: message }
  }
}

export async function changeClassroomStatusAction(formData: FormData) {
  const parsed = classroomStatusSchema.safeParse({
    classroomId: formData.get('classroomId')?.toString(),
    status: formData.get('status')?.toString(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid status change' }
  }

  const { classroomId, status } = parsed.data

  try {
    const client = createServiceClient()
    await client.from('classrooms').update({ status }).eq('id', classroomId)

    await logActivity({
      entityType: 'classroom',
      entityId: classroomId,
      action: 'status_changed',
      meta: { status },
    })

    revalidatePath('/admin/classrooms')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update status'
    return { error: message }
  }
}

export async function deleteClassroomAction(formData: FormData) {
  const classroomId = formData.get('classroomId')?.toString()
  if (!classroomId) return { error: 'Missing classroomId' }

  try {
    const client = createServiceClient()
    await client.from('classrooms').update({ status: 'banned' }).eq('id', classroomId)

    await logActivity({
      entityType: 'classroom',
      entityId: classroomId,
      action: 'banned',
    })

    revalidatePath('/admin/classrooms')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete classroom'
    return { error: message }
  }
}
