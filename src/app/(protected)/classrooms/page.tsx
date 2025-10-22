import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import ClassroomCreateForm from './ClassroomCreateForm'
import { findTenantByHost } from '@/lib/tenant'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'

type MembershipRole = 'student' | 'teacher' | 'admin' | 'owner' | string | null

type Classroom = {
  id: string
  title: string
  description: string | null
  subjects: { id: string }[] | null
}

async function resolveTenantId() {
  const cookieStore = await cookies()
  const tenantCookie = cookieStore.get('tenant_id')?.value ?? null
  if (tenantCookie) return tenantCookie
  const host = (await headers()).get('host') ?? ''
  const found = await findTenantByHost(host)
  return found?.tenant_id ?? null
}

export default async function ClassroomsPage() {
  const tenantId = await resolveTenantId()

  if (!tenantId) {
    return (
      <main className="mx-auto max-w-5xl space-y-3 p-6">
        <h1 className="text-xl font-semibold">Classrooms</h1>
        <p className="text-sm text-gray-600">We could not determine your tenant. Please refresh or contact support.</p>
      </main>
    )
  }

  try {
    const service = createServiceClient()
    const user = await getAuthenticatedUser(service)

    const { data: membership } = await service
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return (
        <main className="mx-auto max-w-5xl space-y-3 p-6">
          <h1 className="text-xl font-semibold">Classrooms</h1>
          <p className="text-sm text-gray-600">You are not enrolled in this tenant.</p>
        </main>
      )
    }

    const role: MembershipRole = membership.role
    const managedRoles = new Set(['teacher', 'admin', 'owner'])
    const canManage = role ? managedRoles.has(role.toLowerCase()) : false

    const { data, error } = await service
      .from('classrooms')
      .select('id, title, description, subjects (id)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    const classrooms: Classroom[] = (data ?? []) as Classroom[]

    return (
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Classrooms</h1>
          <p className="text-sm text-gray-600">Manage classrooms inside your institute.</p>
        </div>

        {canManage ? (
          <ClassroomCreateForm canCreate={canManage} />
        ) : (
          <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            You have read-only access. Contact your administrator to manage classrooms.
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error.message}
          </div>
        )}

        <section className="space-y-3">
          {classrooms.length === 0 ? (
            <p className="text-sm text-gray-600">
              No classrooms yet. {canManage ? 'Create one using the form above.' : 'Ask your admin to add classrooms.'}
            </p>
          ) : (
            classrooms.map((room) => (
              <article key={room.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{room.title}</h2>
                    {room.description && <p className="text-sm text-gray-600">{room.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                      {room.subjects?.length ?? 0} subjects
                    </span>
                    <Link
                      href={`/classrooms/${room.id}/subjects`}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      {canManage ? 'Manage Subjects' : 'View Subjects'}
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load classrooms.'
    return (
      <main className="mx-auto max-w-5xl space-y-3 p-6">
        <h1 className="text-xl font-semibold">Classrooms</h1>
        <p className="text-sm text-red-600">{message}</p>
      </main>
    )
  }
}
