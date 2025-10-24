import { AdminOnly } from '@/components/Guard'
import TopBar from '@/components/admin/TopBar'
import TabBarMobile from '@/components/admin/TabBarMobile'
import SettingsClient from './SettingsClient'
import { fetchSettings } from '@/lib/actions/admin/settings'
import { createServiceClient } from '@/lib/actions/supabaseServer'
import { resolveAdminTenantContext } from '@/lib/actions/classrooms'

export const dynamic = 'force-dynamic'

const mobileTabs = [
  { href: '/admin', label: 'Dashboard', icon: <span>📊</span> },
  { href: '/admin/subjects', label: 'Subjects', icon: <span>📚</span> },
  { href: '/admin/lessons', label: 'Lessons', icon: <span>🎓</span> },
  { href: '/admin/settings', label: 'Settings', icon: <span>⚙️</span> },
]

export default async function AdminSettingsPage() {
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  const settings = tenantId ? await fetchSettings() : null

  const content = await AdminOnly({
    children: (
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 pb-20 md:px-8">
        <TopBar
          title="Settings"
          subtitle="Fine-tune branding, enrollment workflow, notification channels, and default roles."
        />
        <TabBarMobile tabs={mobileTabs} />
        {tenantId ? (
          <SettingsClient tenantId={tenantId} settings={settings} />
        ) : (
          <p className="rounded-2xl border border-purple-800/40 bg-[#0b0615] p-6 text-sm text-purple-200">
            Select an institute before editing settings.
          </p>
        )}
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16 text-purple-100">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-purple-200">Switch to admin view or request elevated permissions to manage settings.</p>
      </main>
    )
  }

  return content
}
