import { cookies } from 'next/headers'
import { createServiceClient, getAuthenticatedUser } from './actions/supabaseServer'

export type ViewMode = 'user' | 'admin'

const ADMIN_ROLES = new Set(['owner', 'admin', 'teacher'])

type AuthContext = Awaited<ReturnType<typeof getAuthContext>>

async function getAuthedServiceClient() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb-refresh-token')?.value
  if (!accessToken || !refreshToken) return null

  const supa = createServiceClient()
  const { error } = await supa.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  if (error) return null
  return supa
}

async function getAuthContext() {
  try {
    const client = await getAuthedServiceClient()
    if (!client) return null
    const user = await getAuthenticatedUser(client)
    return { client, user }
  } catch {
    return null
  }
}

async function lookupMembership(ctx: NonNullable<AuthContext>, tenantId: string) {
  const { client, user } = ctx
  const { data, error } = await client
    .from('tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data?.role) return null
  return data.role.toLowerCase()
}

export async function getIsSuperAdmin(): Promise<boolean> {
  const supa = await getAuthedServiceClient()
  if (!supa) return false

  const { data, error } = await supa.rpc('f_is_superadmin')
  if (error) return false
  return Boolean(data)
}

export async function isSuperAdmin(): Promise<boolean> {
  return getIsSuperAdmin()
}

export async function isAdminLike(tenantId?: string | null): Promise<boolean> {
  if (await getIsSuperAdmin()) return true

  const ctx = await getAuthContext()
  if (!ctx) return false

  const cookieStore = await cookies()
  const targetTenant =
    tenantId ?? cookieStore.get('tenant_id')?.value ?? null
  if (!targetTenant) return false

  const role = await lookupMembership(ctx, targetTenant)
  if (!role) return false
  return ADMIN_ROLES.has(role)
}

export async function getViewMode(): Promise<ViewMode> {
  const cookieStore = await cookies()
  const rawMode = cookieStore.get('view_mode')?.value

  const superAdmin = await getIsSuperAdmin()

  if (rawMode === 'admin' || rawMode === 'user') {
    return rawMode
  }

  if (superAdmin) return 'admin'

  const ctx = await getAuthContext()
  if (!ctx) return 'user'

  const tenantId = cookieStore.get('tenant_id')?.value
  if (!tenantId) return 'user'

  const role = await lookupMembership(ctx, tenantId)
  return role && ADMIN_ROLES.has(role) ? 'admin' : 'user'
}
