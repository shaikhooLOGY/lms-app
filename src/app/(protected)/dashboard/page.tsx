'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ClassroomRow = {
  id: string
  title: string
  subjects: { id: string }[] | null
}

type Stats = {
  classrooms: number
  subjects: number
  students: number
}

const NAV_ITEMS = [{ label: 'Settings', href: '/settings' }]

const MANAGED_ROLES = new Set(['teacher', 'admin', 'owner'])

export default function DashboardPage() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([])
  const [stats, setStats] = useState<Stats>({ classrooms: 0, subjects: 0, students: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantMissing, setTenantMissing] = useState(false)
  const [viewMode, setViewMode] = useState<'member' | 'admin'>('member')

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError(null)

      const { data: authData } = await supabase.auth.getUser()
      if (!active) return
      if (authData?.user) setEmail(authData.user.email ?? null)

      const { data: membership, error: membershipError } = await supabase
        .from('tenant_members')
        .select('tenant_id, role')
        .limit(1)
        .maybeSingle()

      if (!active) return

      if (membershipError) {
        setError(membershipError.message)
        setLoading(false)
        return
      }

      if (!membership) {
        setTenantMissing(true)
        setLoading(false)
        return
      }

      const tenantId = membership.tenant_id
      const membershipRole = membership.role ?? null
      const normalizedRole = membershipRole?.toLowerCase() ?? ''

      setTenantMissing(false)
      setTenantId(tenantId)
      setRole(membershipRole)
      const manage = MANAGED_ROLES.has(normalizedRole)
      setCanManage(manage)
      setViewMode(manage ? 'admin' : 'member')

      const [classroomsResult, memberCountResult] = await Promise.all([
        supabase
          .from('classrooms')
          .select('id, title, subjects (id)')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: true }),
        supabase
          .from('tenant_members')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),
      ])

      if (!active) return

      if (classroomsResult.error) {
        setError(classroomsResult.error.message)
        setLoading(false)
        return
      }

      const rows = (classroomsResult.data ?? []) as ClassroomRow[]
      setClassrooms(rows)
      const totalSubjects = rows.reduce((acc, row) => acc + (row.subjects?.length ?? 0), 0)
      const totalStudents = memberCountResult.count ?? 0
      setStats({ classrooms: rows.length, subjects: totalSubjects, students: totalStudents })
      setLoading(false)
    }

    loadData()
    return () => {
      active = false
    }
  }, [])

  const sidebarContent = useMemo(
    () => (
      <div className="flex h-full flex-col">
        <div className="px-6 py-4 text-lg font-semibold text-gray-900">Shaikhoology LMS</div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-blue-50',
                  isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600',
                ].join(' ')}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-gray-100 px-6 py-4 text-xs text-gray-500">
          Signed in as <span className="font-medium text-gray-700">{email ?? '—'}</span>
        </div>
      </div>
    ),
    [email, pathname]
  )

  const friendlyRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : canManage ? 'Admin' : 'Member'
  const isAdminView = viewMode === 'admin'
  const showCreateClassroom = canManage && isAdminView
  const actionLabel = isAdminView ? 'Manage' : 'View'
  const disabledLinkProps = isAdminView
    ? undefined
    : {
        'aria-disabled': true,
        tabIndex: -1,
        onClick: (event: MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault()
          event.stopPropagation()
        },
      }

  if (tenantMissing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-16">
        <div className="w-full max-w-xl space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Set up your institute</h1>
            <p className="text-sm text-gray-600">
              You are not linked to any institute yet. Create a new one or ask an administrator to invite you.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/onboarding"
              className="block rounded-md bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Create a new institute
            </Link>
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Already part of an institute? Ask your admin to add you from the tenant members page or share their invite
              link.
            </div>
          </div>
        </div>
      </main>
    )
  }

  const isAdminPath = pathname.startsWith('/admin')

  return (
    <div className="flex min-h-screen bg-gray-100">
      {!isAdminPath && (
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:block">
          {sidebarContent}
        </aside>
      )}

      {sidebarOpen && !isAdminPath && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 border-r border-gray-200 bg-white shadow-lg">{sidebarContent}</div>
          <button
            type="button"
            className="flex-1 bg-black/30"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 hover:bg-gray-100 md:hidden"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle sidebar"
            >
              <MenuIcon />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Overview of your institute at a glance.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Role: <span className="capitalize">{friendlyRole}</span>
            </span>
            {tenantId && (
              <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
                Tenant ID: <code className="ml-1 text-gray-700">{tenantId}</code>
              </span>
            )}
            {canManage ? (
              <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs font-medium text-gray-600 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('member')}
                  className={[
                    'rounded-md px-3 py-1 transition',
                    !isAdminView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                  ].join(' ')}
                >
                  Member view
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('admin')}
                  className={[
                    'rounded-md px-3 py-1 transition',
                    isAdminView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                  ].join(' ')}
                >
                  Admin view
                </button>
              </div>
            ) : null}
            {showCreateClassroom ? (
              <Link
                href="/classrooms/new"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Create classroom
              </Link>
            ) : null}
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8">
          {canManage ? (
            <section>
              <Card>
                <CardHeader>
                  <CardTitle>{isAdminView ? 'Admin quick actions' : 'Administrator tools (disabled in member view)'}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Link
                    href="/classrooms/new"
                    className={[
                      'inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium transition',
                      isAdminView
                        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed',
                    ].join(' ')}
                    {...(disabledLinkProps ?? {})}
                  >
                    New classroom
                  </Link>
                  <Link
                    href="/subjects"
                    className={[
                      'inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium transition',
                      isAdminView
                        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed',
                    ].join(' ')}
                    {...(disabledLinkProps ?? {})}
                  >
                    Manage subjects
                  </Link>
                  <Link
                    href="/settings"
                    className={[
                      'inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium transition',
                      isAdminView
                        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed',
                    ].join(' ')}
                    {...(disabledLinkProps ?? {})}
                  >
                    Institute settings
                  </Link>
                  <Link
                    href="/onboarding"
                    className={[
                      'inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium transition',
                      isAdminView
                        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed',
                    ].join(' ')}
                    {...(disabledLinkProps ?? {})}
                  >
                    Create another institute
                  </Link>
                </CardContent>
              </Card>
            </section>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard title="Total Classrooms" value={stats.classrooms} loading={loading} />
            <StatCard title="Subjects" value={stats.subjects} loading={loading} />
            <StatCard title="Students" value={stats.students} loading={loading} />
          </section>

          <section>
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Recent Classrooms</CardTitle>
                <Link
                  href="/classrooms"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th scope="col" className="px-3 py-2">
                          Classroom
                        </th>
                        <th scope="col" className="px-3 py-2">
                          Subjects
                        </th>
                        <th scope="col" className="px-3 py-2 text-right">
                          {isAdminView ? 'Actions' : 'Explore'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {loading ? (
                        <tr>
                          <td className="px-3 py-4" colSpan={3}>
                            <span className="inline-block h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                          </td>
                        </tr>
                      ) : classrooms.length === 0 ? (
                        <tr>
                          <td className="px-3 py-6 text-center text-gray-500" colSpan={3}>
                            No classrooms yet.
                          </td>
                        </tr>
                      ) : (
                        classrooms.map((room) => (
                          <tr key={room.id} className="text-gray-700">
                            <td className="px-3 py-3 font-medium">{room.title}</td>
                            <td className="px-3 py-3">
                              {room.subjects?.length ?? 0}{' '}
                              <span className="text-xs text-gray-400">subjects</span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Link
                                href={`/classrooms/${room.id}/subjects`}
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              >
                                {actionLabel}
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  )
}

type StatCardProps = {
  title: string
  value: number
  loading?: boolean
}

function StatCard({ title, value, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded bg-gray-100" />
        ) : (
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

function MenuIcon() {
  return (
    <svg
      className="h-5 w-5 text-gray-700"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
