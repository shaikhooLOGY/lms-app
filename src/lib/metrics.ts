import { createServiceClient } from './actions/supabaseServer'

export type MetricSummary = {
  institutesTotal: number
  institutesPending: number
  institutesSuspended: number
  activeClassrooms: number
  subjectsCount: number
  lessonsCount: number
  educatorsCount: number
  studentsCount: number
  pendingApprovals: number
}

export async function fetchMetricSummary(): Promise<MetricSummary> {
  const client = createServiceClient()

  const institutesTotal = await countResponse(
    client.from('tenants').select('id', { count: 'exact', head: true }) as CountPromise
  )
  const institutesPending = await countResponse(
    client
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review') as CountPromise
  )
  const institutesSuspended = await countResponse(
    client.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'suspended') as CountPromise
  )
  const activeClassrooms = await countResponse(
    client.from('classrooms').select('id', { count: 'exact', head: true }).eq('status', 'published') as CountPromise
  )
  const subjectsCount = await countResponse(
    client.from('subjects').select('id', { count: 'exact', head: true }) as CountPromise
  )
  const lessonsCount = await countResponse(
    client.from('chapters').select('id', { count: 'exact', head: true }) as CountPromise
  )
  const educatorsCount = await countResponse(
    client
      .from('tenant_members')
      .select('id', { count: 'exact', head: true })
      .in('role', ['owner', 'admin', 'teacher']) as CountPromise
  )
  const studentsCount = await countResponse(
    client.from('tenant_members').select('id', { count: 'exact', head: true }).eq('role', 'student') as CountPromise
  )
  const pendingApprovals = await countResponse(
    client.from('approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending') as CountPromise
  )

  return {
    institutesTotal,
    institutesPending,
    institutesSuspended,
    activeClassrooms,
    subjectsCount,
    lessonsCount,
    educatorsCount,
    studentsCount,
    pendingApprovals,
  }
}

type CountResponse = {
  count: number | null
  error: unknown
}

type CountPromise = PromiseLike<CountResponse>

async function countResponse(promise: CountPromise): Promise<number> {
  const response = await promise
  const { count, error } = response
  if (error) {
    console.error('Metric count error', error)
    return 0
  }
  return count ?? 0
}
