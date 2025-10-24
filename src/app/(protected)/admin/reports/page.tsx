import { AdminOnly } from '@/components/Guard'
import TopBar from '@/components/admin/TopBar'
import TabBarMobile from '@/components/admin/TabBarMobile'
import ReportsClient from './ReportsClient'
import { fetchReports } from '@/lib/actions/admin/reports'

export const dynamic = 'force-dynamic'

const mobileTabs = [
  { href: '/admin', label: 'Dashboard', icon: <span>📊</span> },
  { href: '/admin/subjects', label: 'Subjects', icon: <span>📚</span> },
  { href: '/admin/lessons', label: 'Lessons', icon: <span>🎓</span> },
  { href: '/admin/reports', label: 'Reports', icon: <span>📈</span> },
]

function getDefaultRange(searchParams: Record<string, string | string[] | undefined>) {
  const today = new Date()
  const end = Array.isArray(searchParams.end) ? searchParams.end[0] : searchParams.end
  const start = Array.isArray(searchParams.start) ? searchParams.start[0] : searchParams.start

  const endDate = end ? new Date(end) : today
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  }
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { start, end } = getDefaultRange(searchParams)
  const reports = await fetchReports(start, end)

  const content = await AdminOnly({
    children: (
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 pb-20 md:px-8">
        <TopBar
          title="Reports"
          subtitle="Measure engagement, completion, and risk to keep your institute thriving."
        />
        <TabBarMobile tabs={mobileTabs} />
        <ReportsClient
          start={start}
          end={end}
          engagement={reports.engagement}
          completion={reports.completion}
          atRisk={reports.atRisk}
        />
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16 text-purple-100">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-purple-200">Switch to admin view or request elevated permissions to view reports.</p>
      </main>
    )
  }

  return content
}
