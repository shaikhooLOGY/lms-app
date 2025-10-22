'use server'

import { cookies } from 'next/headers'
import { createServiceClient, getAuthenticatedUser } from './supabaseServer'

type CreateTenantInput = {
  name: string
  subdomain?: string | null
}

type CreateTenantResult = {
  tenantId: string
}

export async function createTenantAction(input: CreateTenantInput): Promise<CreateTenantResult> {
  const name = input.name.trim()
  const subdomain = input.subdomain?.trim().toLowerCase() ?? ''

  if (!name) {
    throw new Error('Institute name is required.')
  }

  const client = createServiceClient()
  const user = await getAuthenticatedUser(client)

  const { data: tenant, error: tenantError } = await client
    .from('tenants')
    .insert([{ name, owner_user_id: user.id }])
    .select('id')
    .single()

  if (tenantError || !tenant) {
    throw new Error(tenantError?.message ?? 'Unable to create institute.')
  }

  if (subdomain) {
    const { error: domainError } = await client.from('tenant_domains').insert([
      {
        tenant_id: tenant.id,
        kind: 'subdomain',
        subdomain,
        is_primary: true,
      },
    ])

    if (domainError) {
      throw new Error(domainError.message)
    }
  }

  const { error: membershipError } = await client.from('memberships').insert([
    {
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'owner',
    },
  ])

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  const { error: legacyMembershipError } = await client.from('tenant_members').insert([
    {
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'owner',
    },
  ])

  if (legacyMembershipError && legacyMembershipError.code !== '23505') {
    throw new Error(legacyMembershipError.message)
  }

  const cookieStore = await cookies()
  cookieStore.set('tenant_id', tenant.id, {
    path: '/',
    httpOnly: false,
  })

  return { tenantId: tenant.id }
}
