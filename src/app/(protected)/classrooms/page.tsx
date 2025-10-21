import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import ClassroomCreateForm from './ClassroomCreateForm'
import { findTenantByHost } from '@/lib/tenant'

type Classroom = {
  id: string
  title: string
  description: string | null
}

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function resolveTenantId() {
  const tenantCookie = cookies().get('tenant_id')?.value ?? null
  if (tenantCookie) return tenantCookie
  const host = headers().get('host') ?? ''
  const found = await findTenantByHost(host)
  return found?.tenant_id ?? null
}

export default async function ClassroomsPage() {
  const tenantId = await resolveTenantId()

  if (!tenantId) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-3">Classrooms</h1>
        <p className="text-sm text-gray-600">
          We could not determine your tenant. Please complete onboarding or try again.
        </p>
      </main>
    )
  }

  const { data, error } = await supa
    .from('classrooms')
    .select('id, title, description')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  const classrooms: Classroom[] = data ?? []

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Classrooms</h1>
        <p className="text-sm text-gray-600">
          Manage classrooms inside your institute.
        </p>
      </div>

      <ClassroomCreateForm tenantId={tenantId} />

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <section className="space-y-3">
        {classrooms.length === 0 ? (
          <p className="text-sm text-gray-600">No classrooms yet. Create one above.</p>
        ) : (
          classrooms.map((room) => (
            <article
              key={room.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium">{room.title}</h2>
                  {room.description && (
                    <p className="text-sm text-gray-600">{room.description}</p>
                  )}
                </div>
                <Link
                  href={`/classrooms/${room.id}/subjects`}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Manage Subjects
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  )
}
