import { AdminOnly } from '@/components/Guard'
import TopBar from '@/components/admin/TopBar'
import TabBarMobile from '@/components/admin/TabBarMobile'
import EducatorsClient from './EducatorsClient'
import { listMembersByRole } from '@/lib/actions/admin/memberships'
import { resolveAdminTenantContext } from '@/lib/actions/classrooms'
import { createServiceClient } from '@/lib/actions/supabaseServer'

export const dynamic = 'force-dynamic'

const mobileTabs = [
  { href: '/admin', label: 'Dashboard', icon: <span>📊</span> },
  { href: '/admin/educators', label: 'Educators', icon: <span>👨‍🏫</span> },
  { href: '/admin/students', label: 'Students', icon: <span>🎓</span> },
  { href: '/admin/approvals', label: 'Approvals', icon: <span>✅</span> },
]

export default async function AdminEducatorsPage() {
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  const members = await listMembersByRole('educators')

  const content = await AdminOnly({
    children: (
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 pb-20 md:px-8">
        <TopBar
          title="Educators"
          subtitle="Promote trusted members, manage roles, and keep your instructional staff aligned."
        />
        <TabBarMobile tabs={mobileTabs} />
        {tenantId ? (
          <EducatorsClient tenantId={tenantId} members={members} />
        ) : (
          <p className="rounded-2xl border border-purple-800/40 bg-[#0b0615] p-6 text-sm text-purple-200">
            Select an institute before managing educators.
          </p>
        )}
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16 text-purple-100">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-purple-200">Switch to admin view or request elevated permissions to manage educators.</p>
      </main>
    )
  }

  return content
}
