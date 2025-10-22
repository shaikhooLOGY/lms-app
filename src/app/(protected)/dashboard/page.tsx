'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Classrooms', href: '/classrooms' },
  { label: 'Subjects', href: '/subjects' },
  { label: 'Settings', href: '/settings' },
]

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
        setError('You are not enrolled in any tenant yet.')
        setLoading(false)
        return
      }

      const tenantId = membership.tenant_id
      const role = membership.role?.toLowerCase() ?? ''
      setCanManage(MANAGED_ROLES.has(role))

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:block">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
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
          {canManage ? (
            <Link
              href="/classrooms/new"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Create classroom
            </Link>
          ) : null}
        </header>

        <main className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8">
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
                          Actions
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
                                {canManage ? 'Manage' : 'View'}
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
