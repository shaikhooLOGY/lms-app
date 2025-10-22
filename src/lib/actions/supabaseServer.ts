import 'server-only'

import { cookies } from 'next/headers'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type ServiceClient = SupabaseClient
type AnonClient = SupabaseClient

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  return url
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  return key
}

function getAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return key
}

function createAnonClient(): AnonClient {
  return createClient(getSupabaseUrl(), getAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function createServiceClient(): ServiceClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function getOptionalUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  if (!accessToken) return null

  const client = createAnonClient()
  const { data, error } = await client.auth.getUser(accessToken)
  if (error || !data?.user) return null

  return data.user
}

export async function getAuthenticatedUser(client: ServiceClient = createServiceClient()): Promise<User> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  if (!accessToken) throw new Error('Not authenticated')

  const { data, error } = await client.auth.getUser(accessToken)
  if (error || !data?.user) throw new Error('Not authenticated')
  return data.user
}
