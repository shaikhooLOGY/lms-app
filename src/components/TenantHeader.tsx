// NO "use client"
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import ModeToggle from './ModeToggle'
import UserMenu from './UserMenu'
import { findTenantByHost } from '@/lib/tenant'
import { getViewMode, getIsSuperAdmin } from '@/lib/permissions'
import { createServiceClient } from '@/lib/actions/supabaseServer'
import { requireSession } from '@/lib/auth/requireSession'

export default async function TenantHeader() {
  const cookieStore = await cookies()
  const headerList = await headers()

  let tenantId = cookieStore.get('tenant_id')?.value ?? null
  if (!tenantId) {
    const host = headerList.get('host') ?? ''
    tenantId = (await findTenantByHost(host))?.tenant_id ?? null
  }

  const user = await requireSession()

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
    { href: '/admin', label: 'Admin' },
    { href: '/admin/classrooms', label: 'Classrooms' },
    { href: '/admin/subjects', label: 'Subjects' },
    { href: '/admin/lessons', label: 'Lessons' },
    { href: '/admin/educators', label: 'Educators' },
    { href: '/admin/students', label: 'Students' },
    { href: '/admin/approvals', label: 'Approvals' },
    { href: '/admin/settings', label: 'Settings' },
    { href: '/admin/reports', label: 'Reports' },
  ]

  const links = mode === 'admin' ? adminLinks : userLinks
  const currentPath = headerList.get('x-invoke-path') ?? headerList.get('x-pathname') ?? '/'

  return (
    <header className="border-b border-purple-500/20 bg-gradient-to-r from-[#0b0615] via-[#0d081a] to-[#080512]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3 text-purple-100">
          <Link href={mode === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600/40 text-lg">Λ</span>
            <span>{title}</span>
          </Link>
        </div>
        <nav className="hidden items-center gap-2 text-sm font-medium text-purple-200 md:flex">
          {links.map((link) => {
            const active = currentPath === link.href || currentPath.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'rounded-full px-3 py-1.5 transition',
                  active ? 'bg-purple-600/30 text-white' : 'hover:bg-purple-500/10 hover:text-white',
                ].join(' ')}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-3">
          {superAdmin ? <ModeToggle initialMode={mode} /> : null}
          <UserMenu
            email={user.email ?? null}
            tenantName={title}
            role={superAdmin ? 'superadmin' : role}
            isSuperAdmin={superAdmin}
            viewMode={mode}
          />
        </div>
      </div>
    </header>
  )
}
