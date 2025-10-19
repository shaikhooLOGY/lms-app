// NO "use client"
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function findTenantByHost(host: string) {
  const h = host.toLowerCase()

  // ali.learn.shaikhoology.com → sub = 'ali'
  if (h.endsWith('learn.shaikhoology.com')) {
    const sub = h.split('.')[0]
    if (sub && sub !== 'learn') {
      const { data } = await supa
        .from('tenant_domains')
        .select('tenant_id')
        .eq('subdomain', sub)
        .maybeSingle()
      return data?.tenant_id ?? null
    }
  }

  // custom domain
  const { data } = await supa
    .from('tenant_domains')
    .select('tenant_id')
    .eq('custom_domain', h)
    .maybeSingle()
  return data?.tenant_id ?? null
}

export default async function TenantHeader() {
  const host = (await headers()).get('host') ?? ''
  const tenantId = await findTenantByHost(host)

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
        <nav className="text-sm">
          <a href="/dashboard">Dashboard</a>
          <span className="mx-2">·</span>
          <a href="/auth">Auth</a>
        </nav>
      </div>
    </header>
  )
}