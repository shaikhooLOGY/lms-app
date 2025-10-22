// NO "use client"
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import ModeToggle from './ModeToggle'
import UserMenu from './UserMenu'
import { findTenantByHost } from '@/lib/tenant'
import { getViewMode, getIsSuperAdmin } from '@/lib/permissions'
import { createServiceClient, getOptionalUser } from '@/lib/actions/supabaseServer'

export default async function TenantHeader() {
  const cookieStore = await cookies()
  let tenantId = cookieStore.get('tenant_id')?.value ?? null

  if (!tenantId) {
    const host = (await headers()).get('host') ?? ''
    tenantId = (await findTenantByHost(host))?.tenant_id ?? null
  }

  const user = await getOptionalUser()
  if (!user) {
    return (
      <header className="border-b p-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <strong>Shaikhoology LMS</strong>
          <Link href="/sign-in" className="text-sm font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </header>
    )
  }

  const client = createServiceClient()
  const [mode, superAdmin] = await Promise.all([getViewMode(), getIsSuperAdmin()])

  const { data: memberships } = await client
    .from('tenant_members')
    .select('tenant_id, role')
    .eq('user_id', user.id)

  const membership =
    memberships?.find((member) => member.tenant_id === tenantId) ?? memberships?.[0] ?? null

  if (!tenantId && membership) {
    tenantId = membership.tenant_id
  }

  let title = 'Shaikhoology LMS'
  if (tenantId) {
    const { data } = await client
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .maybeSingle()
    if (data?.name) title = data.name
  }

  const role = membership?.role?.toLowerCase() ?? null

  const userLinks = [
    { href: '/user/dashboard', label: 'Dashboard' },
    { href: '/classrooms', label: 'Classrooms' },
  ]

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Admin' },
    { href: '/admin/classrooms', label: 'Classrooms' },
    { href: '/admin/enrollments', label: 'Enrollments' },
  ]

  const links = mode === 'admin' ? adminLinks : userLinks

  return (
    <header className="p-4 border-b">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <strong>{title}</strong>
        <nav className="flex items-center gap-3 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
          {superAdmin ? <ModeToggle initialMode={mode} /> : null}
          <UserMenu
            email={user.email ?? null}
            tenantName={title}
            role={superAdmin ? 'superadmin' : role}
            isSuperAdmin={superAdmin}
            viewMode={mode}
          />
        </nav>
      </div>
    </header>
  )
}
