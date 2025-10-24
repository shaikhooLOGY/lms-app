import { AdminOnly } from '@/components/Guard'
import TopBar from '@/components/admin/TopBar'
import AdminCard from '@/components/admin/AdminCard'
import TabBarMobile from '@/components/admin/TabBarMobile'
import EmptyState from '@/components/admin/EmptyState'
import { fetchMetricSummary } from '@/lib/metrics'

export const dynamic = 'force-dynamic'

const mobileTabs = [
  { href: '/admin', label: 'Dashboard', icon: <span>📊</span> },
  { href: '/admin/institutes', label: 'Institutes', icon: <span>🏛️</span> },
  { href: '/admin/classrooms', label: 'Classrooms', icon: <span>🏫</span> },
  { href: '/admin/approvals', label: 'Approvals', icon: <span>✅</span> },
]

export default async function AdminHomePage() {
  const metrics = await fetchMetricSummary()

  const content = await AdminOnly({
    children: (
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 pb-20 md:px-8">
        <TopBar
          title="SuperAdmin Command Center"
          subtitle="Monitor institutes, classrooms, and learner engagement across the network."
        />
        <TabBarMobile tabs={mobileTabs} />

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AdminCard
            title="Institutes"
            value={metrics.institutesTotal.toLocaleString()}
            description={`${metrics.institutesPending.toLocaleString()} pending · ${metrics.institutesSuspended.toLocaleString()} suspended`}
            icon={<span>🏛️</span>}
          />
          <AdminCard
            title="Active Classrooms"
            value={metrics.activeClassrooms.toLocaleString()}
            description="Published and open for learners"
            icon={<span>🏫</span>}
          />
          <AdminCard
            title="Subjects & Lessons"
            value={`${metrics.subjectsCount.toLocaleString()} / ${metrics.lessonsCount.toLocaleString()}`}
            description="Subjects · Lessons"
            icon={<span>📚</span>}
          />
          <AdminCard
            title="Educators"
            value={metrics.educatorsCount.toLocaleString()}
            description="Owners · Admins · Teachers"
            icon={<span>👩‍🏫</span>}
          />
          <AdminCard
            title="Learners"
            value={metrics.studentsCount.toLocaleString()}
            description="Active students across tenants"
            icon={<span>🧑‍🎓</span>}
          />
          <AdminCard
            title="Pending Approvals"
            value={metrics.pendingApprovals.toLocaleString()}
            description="Items awaiting moderation"
            icon={<span>⏳</span>}
          >
            <a
              href="/admin/approvals"
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-200 hover:text-white"
            >
              Review queue →
            </a>
          </AdminCard>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-purple-800/40 bg-[#0b0615] p-6 text-purple-100 shadow-[0_20px_50px_-35px_rgba(168,85,247,0.9)]">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Global Settings</h2>
                <p className="text-sm text-purple-300/80">
                  Configure branding, enrollment policies, and notification rules.
                </p>
              </div>
              <a
                href="/admin/settings"
                className="rounded-full border border-purple-700/60 px-3 py-1 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-500 hover:text-white"
              >
                Manage
              </a>
            </header>
            <ul className="space-y-3 text-sm text-purple-200">
              <li>• Branding controls for tenant-level assets.</li>
              <li>• Enrollment approval defaults and auto-approvals.</li>
              <li>• Notification channels & SLAs.</li>
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl border border-purple-800/40 bg-[#080411] p-6 text-purple-100 shadow-[0_20px_50px_-35px_rgba(147,51,234,0.9)]">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Reports & Insights</h2>
                <p className="text-sm text-purple-300/80">Dig into engagement, completion, and at-risk cohorts.</p>
              </div>
              <a
                href="/admin/reports"
                className="rounded-full border border-purple-700/60 px-3 py-1 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-500 hover:text-white"
              >
                View reports
              </a>
            </header>
            <ul className="space-y-3 text-sm text-purple-200">
              <li>• Export CSV snapshots for leadership reviews.</li>
              <li>• Filter by tenant, instructor, or cohort.</li>
              <li>• Identify trends before they impact learners.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-purple-800/40 bg-[#090512] p-6 text-purple-100 shadow-[0_18px_45px_-32px_rgba(124,58,237,0.7)]">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <p className="text-sm text-purple-300/80">Stay on top of institute launches, approvals, and escalations.</p>
            </div>
            <a
              href="/admin/approvals"
              className="rounded-full border border-purple-700/60 px-4 py-1.5 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-500 hover:text-white"
            >
              View full log
            </a>
          </header>
          <div className="mt-4">
            <EmptyState
              title="No activity yet"
              description="Once institutes start launching and approvals roll in, you’ll see them here."
            />
          </div>
        </section>
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16 text-purple-100">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-purple-200">
          Switch to admin view or request elevated permissions to access the SuperAdmin area.
        </p>
      </main>
    )
  }

  return content
}
