'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getOptionalUser } from '@/lib/actions/supabaseServer'

async function resolveCurrentPath(explicit?: string): Promise<string> {
  if (explicit) return explicit
  const headerList = await headers()
  return (
    headerList.get('x-invoke-path') ??
    headerList.get('x-pathname') ??
    headerList.get('referer') ??
    '/'
  )
}

export async function requireSession(redirectPath?: string) {
  const user = await getOptionalUser()
  if (user) return user

  const nextPath = await resolveCurrentPath(redirectPath)
  redirect(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`)
}
