import { createClient } from '@supabase/supabase-js'

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function findTenantByHost(host: string) {
  // host examples:
  // - ali.learn.shaikhoology.com  -> subdomain: 'ali'
  // - learn.shaikhoology.com      -> maybe landing (no subdomain)
  // - customdomain.com            -> custom_domain match
  const parts = host.toLowerCase().split('.')

  if (host.endsWith('learn.shaikhoology.com')) {
    const sub = parts[0] // 'ali' from 'ali.learn...'
    if (sub && sub !== 'learn') {
      const { data, error } = await supa
        .from('tenant_domains')
        .select('id, tenant_id')
        .eq('subdomain', sub)
        .maybeSingle()
      if (error) return null
      return data
    }
  }

  // custom domain fallback
  const { data, error } = await supa
    .from('tenant_domains')
    .select('id, tenant_id')
    .eq('custom_domain', host)
    .maybeSingle()
  if (error) return null
  return data
}