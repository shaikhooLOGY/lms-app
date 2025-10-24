'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'
import { upsertTenantSchema, tenantStatusSchema } from '@/lib/validators/tenant'

type TenantRecord = {
  id: string
  name: string
  status: string
  created_at: string
  tenant_domains?: { subdomain: string | null; is_primary: boolean | null }[] | null
}

export async function listTenants(
  search: string | null,
  status: string | null,
  limit = 25,
  cursor?: string | null
): Promise<{ records: (TenantRecord & { subdomain?: string | null })[]; nextCursor: string | null }> {
  const client = createServiceClient()
  const query = client
    .from('tenants')
    .select('id, name, status, created_at, tenant_domains(subdomain, is_primary)')
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (search) {
    query.ilike('name', `%${search}%`)
  }
  if (status) {
    query.eq('status', status)
  }
  if (cursor) {
    query.lt('created_at', cursor)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as TenantRecord[]
  const hasNext = rows.length > limit
  const mapped = rows.slice(0, limit).map((row) => ({
    ...row,
    subdomain:
      row.tenant_domains?.find((domain) => domain?.is_primary)?.subdomain ??
      row.tenant_domains?.[0]?.subdomain ??
      null,
  }))
  return {
    records: mapped,
    nextCursor: hasNext ? rows[limit].created_at : null,
  }
}

export async function upsertTenantAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const rawSubdomain = formData.get('subdomain')?.toString() ?? undefined
  const parsed = upsertTenantSchema.safeParse({
    id: formData.get('id')?.toString(),
    name: formData.get('name')?.toString(),
    subdomain: rawSubdomain && rawSubdomain.trim() !== '' ? rawSubdomain : undefined,
    status: formData.get('status')?.toString(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)

    const payload = parsed.data
    const isUpdate = Boolean(payload.id)

    const updates: Record<string, unknown> = {
      name: payload.name,
      updated_by: user.id,
    }

    if (payload.status) {
      updates.status = payload.status
    }

    let tenantId = payload.id ?? null

    if (isUpdate && tenantId) {
      const { error } = await client.from('tenants').update(updates).eq('id', tenantId)
      if (error) throw error
    } else {
      const { data, error } = await client
        .from('tenants')
        .insert([{ ...updates, owner_user_id: user.id, status: updates.status ?? 'pending_review' }])
        .select('id')
        .single()
      if (error || !data) throw error ?? new Error('Unable to create tenant')
      tenantId = data.id

      await Promise.all([
        client.from('memberships').insert([{ tenant_id: tenantId, user_id: user.id, role: 'owner' }]),
        client.from('tenant_members').insert([{ tenant_id: tenantId, user_id: user.id, role: 'owner' }]),
      ])
    }

    if (payload.subdomain && tenantId) {
      await client.from('tenant_domains').upsert(
        {
          tenant_id: tenantId,
          kind: 'subdomain',
          subdomain: payload.subdomain,
          is_primary: true,
        },
        {
          onConflict: 'tenant_id',
        }
      )
    }

    if (!isUpdate && tenantId) {
      await attachTenantCookieInternal(tenantId)
    }

    revalidatePath('/admin/institutes')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save institute'
    return { error: message }
  }
}

export async function updateTenantStatusAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const parsed = tenantStatusSchema.safeParse({
    tenantId: formData.get('tenantId')?.toString(),
    status: formData.get('status')?.toString(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    const client = createServiceClient()
    await client
      .from('tenants')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.tenantId)

    revalidatePath('/admin/institutes')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update status'
    return { error: message }
  }
}

export async function attachTenantCookie(tenantId: string) {
  const cookieStore = await cookies()
  cookieStore.set('tenant_id', tenantId, { path: '/', httpOnly: false })
}

async function attachTenantCookieInternal(tenantId: string) {
  await attachTenantCookie(tenantId)
}
