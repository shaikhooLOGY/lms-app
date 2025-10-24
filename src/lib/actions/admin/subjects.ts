'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'
import { resolveAdminTenantContext } from '@/lib/actions/classrooms'
import { logActivity } from './activity'
import { reorderSubjectsSchema, upsertSubjectSchema } from '@/lib/validators/subject'

export type AdminSubjectRecord = {
  id: string
  title: string
  description: string | null
  status: string
  sort_order: number | null
  classroom_id: string
  lessons_count: number
}

export async function listSubjects(classroomId: string) {
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  if (!tenantId) return []

  const { data, error } = await client
    .from('subjects')
    .select('id, title, description, status, sort_order, classroom_id, chapters(count)')
    .eq('classroom_id', classroomId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    sort_order: row.sort_order,
    classroom_id: row.classroom_id,
    lessons_count: Array.isArray(row.chapters) && row.chapters.length > 0 ? row.chapters[0]?.count ?? 0 : 0,
  })) as AdminSubjectRecord[]
}

export async function listSubjectsForSelect(classroomId: string): Promise<Array<{ id: string; title: string }>> {
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  if (!tenantId) return []

  const { data, error } = await client
    .from('subjects')
    .select('id, title')
    .eq('classroom_id', classroomId)
    .eq('status', 'published')
    .order('sort_order', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({ id: row.id, title: row.title }))
}

export async function upsertSubjectAction(formData: FormData) {
  const parsed = upsertSubjectSchema.safeParse({
    id: formData.get('id')?.toString(),
    classroomId: formData.get('classroomId')?.toString(),
    title: formData.get('title')?.toString(),
    description: formData.get('description')?.toString(),
    status: formData.get('status')?.toString(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid subject payload' }
  }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId } = await resolveAdminTenantContext(client, user.id)
    if (!tenantId) return { error: 'Select an institute before managing subjects.' }

    const payload = parsed.data
    const isUpdate = Boolean(payload.id)

    const record: Record<string, unknown> = {
      title: payload.title,
      description: payload.description ?? null,
      classroom_id: payload.classroomId,
      status: payload.status ?? (isUpdate ? undefined : 'draft'),
    }

    if (!isUpdate) {
      const { data, error } = await client
        .from('subjects')
        .insert([{ ...record, status: record.status ?? 'draft' }])
        .select('id')
        .single()

      if (error || !data) throw error ?? new Error('Unable to create subject')

      await logActivity({
        entityType: 'subject',
        entityId: data.id,
        action: 'created',
        meta: { classroomId: payload.classroomId, title: payload.title },
      })
    } else {
      const { error } = await client
        .from('subjects')
        .update(record)
        .eq('id', payload.id!)

      if (error) throw error

      await logActivity({
        entityType: 'subject',
        entityId: payload.id!,
        action: 'updated',
        meta: { classroomId: payload.classroomId, title: payload.title },
      })
    }

    revalidatePath('/admin/subjects')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save subject'
    return { error: message }
  }
}

export async function deleteSubjectAction(formData: FormData) {
  const id = formData.get('id')?.toString()
  if (!id) return { error: 'Missing subject id' }

  try {
    const client = createServiceClient()
    await client.from('subjects').update({ status: 'archived' }).eq('id', id)

    await logActivity({
      entityType: 'subject',
      entityId: id,
      action: 'archived',
    })

    revalidatePath('/admin/subjects')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to archive subject'
    return { error: message }
  }
}

export async function reorderSubjectsAction(formData: FormData) {
  let orderedIds: unknown
  try {
    orderedIds = JSON.parse(formData.get('orderedIds')?.toString() ?? '[]')
  } catch {
    return { error: 'Invalid order payload' }
  }

  const payload = reorderSubjectsSchema.safeParse({
    classroomId: formData.get('classroomId')?.toString(),
    orderedIds,
  })

  if (!payload.success) {
    return { error: payload.error.issues[0]?.message ?? 'Invalid reorder payload' }
  }

  try {
    const client = createServiceClient()
    await Promise.all(
      payload.data.orderedIds.map((id: string, index: number) =>
        client.from('subjects').update({ sort_order: index + 1 }).eq('id', id)
      )
    )

    await logActivity({
      entityType: 'subject',
      entityId: payload.data.classroomId,
      action: 'reordered',
      meta: { orderedIds: payload.data.orderedIds },
    })

    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reorder subjects'
    return { error: message }
  }
}
