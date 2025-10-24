'use server'

import { createServiceClient } from '@/lib/actions/supabaseServer'
import { resolveAdminTenantContext } from '@/lib/actions/classrooms'

export type EngagementRow = {
  user_id: string
  chapters_viewed: number
  last_activity: string | null
}

export type CompletionRow = {
  user_id: string
  subjects_completed: number
  last_completed: string | null
}

export type AtRiskRow = {
  user_id: string
  pending_enrollments: number
  last_updated: string | null
}

export type ReportBundle = {
  engagement: EngagementRow[]
  completion: CompletionRow[]
  atRisk: AtRiskRow[]
}

function getRangeOrDefault(start?: string, end?: string): { start: string; end: string } {
  const endDate = end ? new Date(end) : new Date()
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  }
}

export async function fetchEngagement(start?: string, end?: string): Promise<EngagementRow[]> {
  const { start: from, end: to } = getRangeOrDefault(start, end)
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  if (!tenantId) return []

  const { data, error } = await client
    .from('user_chapter_progress')
    .select('user_id, updated_at, chapters!inner(subjects!inner(classrooms!inner(tenant_id)))')
    .gte('updated_at', from)
    .lte('updated_at', to)
    .eq('chapters.subjects.classrooms.tenant_id', tenantId)
    .limit(2000)

  if (error) throw new Error(error.message)
  const map = new Map<string, EngagementRow>()

  for (const row of data ?? []) {
    const userId = row.user_id as string
    if (!userId) continue
    const current = map.get(userId) ?? { user_id: userId, chapters_viewed: 0, last_activity: null }
    current.chapters_viewed += 1
    const updated = row.updated_at as string | null
    if (updated && (!current.last_activity || updated > current.last_activity)) {
      current.last_activity = updated
    }
    map.set(userId, current)
  }

  return Array.from(map.values()).sort((a, b) => (b.last_activity ?? '').localeCompare(a.last_activity ?? ''))
}

export async function fetchCompletion(start?: string, end?: string): Promise<CompletionRow[]> {
  const { start: from, end: to } = getRangeOrDefault(start, end)
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  if (!tenantId) return []

  const { data, error } = await client
    .from('user_subject_progress')
    .select('user_id, updated_at, subjects!inner(classrooms!inner(tenant_id))')
    .gte('updated_at', from)
    .lte('updated_at', to)
    .eq('subjects.classrooms.tenant_id', tenantId)
    .limit(2000)

  if (error) throw new Error(error.message)
  const map = new Map<string, CompletionRow>()

  for (const row of data ?? []) {
    const userId = row.user_id as string
    if (!userId) continue
    const current = map.get(userId) ?? { user_id: userId, subjects_completed: 0, last_completed: null }
    current.subjects_completed += 1
    const updated = row.updated_at as string | null
    if (updated && (!current.last_completed || updated > current.last_completed)) {
      current.last_completed = updated
    }
    map.set(userId, current)
  }

  return Array.from(map.values()).sort((a, b) => (b.last_completed ?? '').localeCompare(a.last_completed ?? ''))
}

export async function fetchAtRisk(start?: string, end?: string): Promise<AtRiskRow[]> {
  const { start: from, end: to } = getRangeOrDefault(start, end)
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  if (!tenantId) return []

  const { data, error } = await client
    .from('enrollments')
    .select('user_id, status, updated_at')
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'rejected'])
    .gte('updated_at', from)
    .lte('updated_at', to)
    .limit(2000)

  if (error) throw new Error(error.message)
  const map = new Map<string, AtRiskRow>()

  for (const row of data ?? []) {
    const userId = row.user_id as string
    if (!userId) continue
    const current = map.get(userId) ?? { user_id: userId, pending_enrollments: 0, last_updated: null }
    current.pending_enrollments += 1
    const updated = row.updated_at as string | null
    if (updated && (!current.last_updated || updated > current.last_updated)) {
      current.last_updated = updated
    }
    map.set(userId, current)
  }

  return Array.from(map.values()).sort((a, b) => (b.pending_enrollments - a.pending_enrollments))
}

export async function fetchReports(start?: string, end?: string): Promise<ReportBundle> {
  const [engagement, completion, atRisk] = await Promise.all([
    fetchEngagement(start, end),
    fetchCompletion(start, end),
    fetchAtRisk(start, end),
  ])

  return { engagement, completion, atRisk }
}

export async function buildCsv(type: 'engagement' | 'completion' | 'at-risk', start?: string, end?: string) {
  if (type === 'engagement') {
    const rows = await fetchEngagement(start, end)
    const header = 'user_id,chapters_viewed,last_activity\n'
    const body = rows
      .map((row) => `${row.user_id},${row.chapters_viewed},${row.last_activity ?? ''}`)
      .join('\n')
    return header + body
  }
  if (type === 'completion') {
    const rows = await fetchCompletion(start, end)
    const header = 'user_id,subjects_completed,last_completed\n'
    const body = rows
      .map((row) => `${row.user_id},${row.subjects_completed},${row.last_completed ?? ''}`)
      .join('\n')
    return header + body
  }
  const rows = await fetchAtRisk(start, end)
  const header = 'user_id,pending_enrollments,last_updated\n'
  const body = rows
    .map((row) => `${row.user_id},${row.pending_enrollments},${row.last_updated ?? ''}`)
    .join('\n')
  return header + body
}
