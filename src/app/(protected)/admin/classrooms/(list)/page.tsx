import { AdminOnly } from '@/components/Guard'
import TopBar from '@/components/admin/TopBar'
import TabBarMobile from '@/components/admin/TabBarMobile'
import { listClassrooms } from '@/lib/actions/admin/classrooms'
import { classroomStatuses } from '@/lib/actions/admin/classrooms.shared'
import ClassroomsClient from '../ClassroomsClient'
import { requireSession } from '@/lib/auth/requireSession'

export const dynamic = 'force-dynamic'

const mobileTabs = [
  { href: '/admin', label: 'Dashboard', icon: <span>📊</span> },
  { href: '/admin/institutes', label: 'Institutes', icon: <span>🏛️</span> },
  { href: '/admin/classrooms', label: 'Classrooms', icon: <span>🏫</span> },
  { href: '/admin/approvals', label: 'Approvals', icon: <span>✅</span> },
]

export default async function AdminClassroomsListPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  await requireSession('/admin/classrooms')
  const search = Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search ?? ''
  const statusParam = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status ?? 'all'

  const records = await listClassrooms(search || null, statusParam)

  const content = await AdminOnly({
    children: (
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 pb-20 md:px-8">
        <TopBar
          title="Classrooms"
          subtitle="Manage classroom lifecycle, assign educators, and control publishing workflows."
        />
        <TabBarMobile tabs={mobileTabs} />

        <FilterBar selectedStatus={statusParam} search={search} />

        <ClassroomsClient records={records} />
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-16 text-purple-100">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-purple-200">Switch to admin view or request elevated permissions to manage classrooms.</p>
      </main>
    )
  }

  return content
}

function FilterBar({ selectedStatus, search }: { selectedStatus: string; search: string }) {
  return (
    <form className="flex flex-col gap-4 rounded-2xl border border-purple-800/40 bg-[#0b0615] p-4 text-purple-100 shadow-[0_18px_45px_-28px_rgba(109,40,217,0.6)] md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <label className="hidden text-xs uppercase tracking-wide text-purple-300 md:block">Search</label>
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search classrooms"
          className="w-full rounded-full border border-purple-700/40 bg-transparent px-4 py-2 text-sm text-white placeholder:text-purple-300 focus:border-purple-400 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <select
          name="status"
          defaultValue={selectedStatus}
          className="rounded-full border border-purple-700/40 bg-transparent px-4 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
        >
          {classroomStatuses.map((option) => (
            <option key={option} value={option} className="bg-[#0b0615]">
              {option.replace('_', ' ')}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full border border-purple-700/40 px-4 py-2 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-500 hover:text-white"
        >
          Apply
        </button>
      </div>
    </form>
  )
}
