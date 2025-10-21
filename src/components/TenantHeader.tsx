// NO "use client"
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import SignOutButton from './SignOutButton'
import { findTenantByHost } from '@/lib/tenant'

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function TenantHeader() {
  const cookieStore = cookies()
  let tenantId = cookieStore.get('tenant_id')?.value ?? null

  if (!tenantId) {
    const host = headers().get('host') ?? ''
    tenantId = (await findTenantByHost(host))?.tenant_id ?? null
  }

  let title = 'Shaikhoology LMS'
  if (tenantId) {
    const { data } = await supa
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .maybeSingle()
    if (data?.name) title = data.name
  }

  return (
    <header className="p-4 border-b">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <strong>{title}</strong>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/classrooms" className="hover:underline">
            Classrooms
          </Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  )
}
