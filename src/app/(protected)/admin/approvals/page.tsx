import { AdminOnly } from '@/components/Guard'
import TopBar from '@/components/admin/TopBar'
import TabBarMobile from '@/components/admin/TabBarMobile'
import ApprovalsClient from './ApprovalsClient'
import { listPendingApprovals } from '@/lib/actions/admin/approvals'
import { requireSession } from '@/lib/auth/requireSession'

export const dynamic = 'force-dynamic'

const mobileTabs = [
  { href: '/admin', label: 'Dashboard', icon: <span>📊</span> },
  { href: '/admin/educators', label: 'Educators', icon: <span>👨‍🏫</span> },
  { href: '/admin/students', label: 'Students', icon: <span>🎓</span> },
  { href: '/admin/approvals', label: 'Approvals', icon: <span>✅</span> },
]

export default async function AdminApprovalsPage() {
  await requireSession('/admin/approvals')
  const approvals = await listPendingApprovals()

  const content = await AdminOnly({
    children: (
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 pb-20 md:px-8">
        <TopBar
          title="Approvals"
          subtitle="Moderate pending actions like classroom publication and educator onboarding."
        />
        <TabBarMobile tabs={mobileTabs} />

        <ApprovalsClient approvals={approvals} />
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16 text-purple-100">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-purple-200">Switch to admin view or request elevated permissions to moderate approvals.</p>
      </main>
    )
  }

  return content
}
