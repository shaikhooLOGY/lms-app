'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'
import { resolveAdminTenantContext } from '@/lib/actions/classrooms'
import { logActivity } from './activity'
import { reorderLessonsSchema, upsertLessonSchema } from '@/lib/validators/lesson'

export type AdminLessonRecord = {
  id: string
  title: string
  content_type: string | null
  content_md: string | null
  video_url: string | null
  sort_order: number | null
  is_free_preview: boolean | null
  subject_id: string
  duration_minutes?: number | null
}

export async function listLessons(subjectId: string) {
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  if (!tenantId) return []

  const { data, error } = await client
    .from('chapters')
    .select('id, title, content_type, content_md, video_url, sort_order, is_free_preview, subject_id, duration_minutes')
    .eq('subject_id', subjectId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AdminLessonRecord[]
}

export async function upsertLessonAction(formData: FormData) {
  const parsed = upsertLessonSchema.safeParse({
    id: formData.get('id')?.toString(),
    subjectId: formData.get('subjectId')?.toString(),
    title: formData.get('title')?.toString(),
    description: formData.get('description')?.toString(),
    type: formData.get('type')?.toString(),
    duration: formData.get('duration')?.toString(),
    videoUrl: formData.get('videoUrl')?.toString(),
    isFreePreview: formData.get('isFreePreview')?.toString(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid lesson payload' }
  }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId } = await resolveAdminTenantContext(client, user.id)
    if (!tenantId) return { error: 'Select an institute before managing lessons.' }

    const payload = parsed.data
    const isUpdate = Boolean(payload.id)

    const durationMinutes = payload.duration && payload.duration.trim() !== '' ? Number.parseInt(payload.duration, 10) : null
    if (durationMinutes !== null && Number.isNaN(durationMinutes)) {
      return { error: 'Duration must be a number' }
    }

    const record: Record<string, unknown> = {
      title: payload.title,
      subject_id: payload.subjectId,
      content_type: payload.type,
      content_md: payload.description ?? null,
      video_url: payload.type === 'video' ? payload.videoUrl ?? null : null,
      is_free_preview: payload.isFreePreview ? true : false,
      duration_minutes: durationMinutes,
    }

    if (!isUpdate) {
      const { data, error } = await client
        .from('chapters')
        .insert([record])
        .select('id')
        .single()

      if (error || !data) throw error ?? new Error('Unable to create lesson')

      await logActivity({
        entityType: 'lesson',
        entityId: data.id,
        action: 'created',
        meta: { subjectId: payload.subjectId, title: payload.title },
      })
    } else {
      const { error } = await client
        .from('chapters')
        .update(record)
        .eq('id', payload.id!)

      if (error) throw error

      await logActivity({
        entityType: 'lesson',
        entityId: payload.id!,
        action: 'updated',
        meta: { subjectId: payload.subjectId, title: payload.title },
      })
    }

    revalidatePath('/admin/lessons')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save lesson'
    return { error: message }
  }
}

export async function deleteLessonAction(formData: FormData) {
  const id = formData.get('id')?.toString()
  if (!id) return { error: 'Missing lesson id' }

  try {
    const client = createServiceClient()
    await client.from('chapters').delete().eq('id', id)

    await logActivity({
      entityType: 'lesson',
      entityId: id,
      action: 'deleted',
    })

    revalidatePath('/admin/lessons')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete lesson'
    return { error: message }
  }
}

export async function reorderLessonsAction(formData: FormData) {
  let orderedIds: unknown
  try {
    orderedIds = JSON.parse(formData.get('orderedIds')?.toString() ?? '[]')
  } catch {
    return { error: 'Invalid order payload' }
  }

  const parsed = reorderLessonsSchema.safeParse({
    subjectId: formData.get('subjectId')?.toString(),
    orderedIds,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid reorder payload' }
  }

  try {
    const client = createServiceClient()
    await Promise.all(
      parsed.data.orderedIds.map((id: string, index: number) =>
        client.from('chapters').update({ sort_order: index + 1 }).eq('id', id)
      )
    )

    await logActivity({
      entityType: 'lesson',
      entityId: parsed.data.subjectId,
      action: 'reordered',
      meta: { orderedIds: parsed.data.orderedIds },
    })

    revalidatePath('/admin/lessons')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reorder lessons'
    return { error: message }
  }
}
