import Link from 'next/link'
import { createServiceClient, getOptionalUser } from '@/lib/actions/supabaseServer'
import { resolveAdminTenantContext, type ClassroomFormState } from '@/lib/actions/classrooms'
import { AdminOnly } from '@/components/Guard'
import { getIsSuperAdmin } from '@/lib/permissions'
import ClassroomCreateForm from './ClassroomCreateForm'

export const dynamic = 'force-dynamic'

type TenantSummary = {
  id: string | null
  name: string | null
  role: string | null
  superAdmin: boolean
}

async function loadTenantSummary(): Promise<TenantSummary> {
  const user = await getOptionalUser()
  const superAdmin = await getIsSuperAdmin()

  if (!user) {
    return { id: null, name: null, role: null, superAdmin }
  }

  const client = createServiceClient()
  const { tenantId, role } = await resolveAdminTenantContext(client, user.id)

  if (!tenantId) {
    return { id: null, name: null, role, superAdmin }
  }

  const { data: tenant } = await client
    .from('tenants')
    .select('id, name')
    .eq('id', tenantId)
    .maybeSingle()

  return { id: tenant?.id ?? tenantId, name: tenant?.name ?? null, role, superAdmin }
}

const initialState: ClassroomFormState = {}

export default async function AdminClassroomCreatePage() {
  const tenantSummary = await loadTenantSummary()

  const content = await AdminOnly({
    tenantId: tenantSummary.id,
    children: (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Create a classroom</h1>
          <p className="text-sm text-gray-600">
            Draft a new classroom for your institute. The classroom remains in draft until you update its status.
          </p>
        </header>
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-medium text-gray-900">Institute:</span>{' '}
            {tenantSummary.name ?? 'Select an institute from the header'}
          </div>
          <ClassroomCreateForm
            disabled={!tenantSummary.id}
            initialState={initialState}
            superAdmin={tenantSummary.superAdmin}
          />
        </section>
        <div>
          <Link href="/admin/classrooms" className="text-sm font-medium text-blue-600 hover:underline">
            Back to classrooms
          </Link>
        </div>
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Access restricted</h1>
        <p className="text-sm text-gray-600">You need administrative permissions to create classrooms.</p>
      </main>
    )
  }

  return content
}
