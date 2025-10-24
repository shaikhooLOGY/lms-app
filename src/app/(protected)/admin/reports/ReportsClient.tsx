'use client'

import { useMemo, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminCard from '@/components/admin/AdminCard'
import DataTable from '@/components/admin/DataTable'
import { EngagementRow, CompletionRow, AtRiskRow } from '@/lib/actions/admin/reports'

type ReportsClientProps = {
  start: string
  end: string
  engagement: EngagementRow[]
  completion: CompletionRow[]
  atRisk: AtRiskRow[]
}

export default function ReportsClient({ start, end, engagement, completion, atRisk }: ReportsClientProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const exportBase = useMemo(() => `/api/admin/reports/export?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, [start, end])

  function handleRangeSubmit(formData: FormData) {
    const nextStart = formData.get('start')?.toString() ?? ''
    const nextEnd = formData.get('end')?.toString() ?? ''
    const query = new URLSearchParams(params.toString())
    if (nextStart) query.set('start', nextStart)
    else query.delete('start')
    if (nextEnd) query.set('end', nextEnd)
    else query.delete('end')
    startTransition(() => {
      router.push(`/admin/reports?${query.toString()}`)
    })
  }

  return (
    <div className="space-y-8">
      <form action={handleRangeSubmit} className="grid gap-3 rounded-2xl border border-purple-800/40 bg-[#0b0615] p-4 text-purple-100 md:grid-cols-4">
        <label className="flex flex-col text-xs uppercase tracking-wide text-purple-300">
          Start date
          <input
            type="date"
            name="start"
            defaultValue={start.slice(0, 10)}
            className="mt-1 rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col text-xs uppercase tracking-wide text-purple-300">
          End date
          <input
            type="date"
            name="end"
            defaultValue={end.slice(0, 10)}
            className="mt-1 rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
          >
            {pending ? 'Loading…' : 'Apply range'}
          </button>
        </div>
        <div className="flex items-end justify-end gap-2 text-xs text-purple-200">
          <a
            className="rounded-full border border-purple-700/40 px-3 py-2 hover:border-purple-400 hover:text-white"
            href={`${exportBase}&type=engagement`}
          >
            Export engagement CSV
          </a>
          <a
            className="rounded-full border border-purple-700/40 px-3 py-2 hover:border-purple-400 hover:text-white"
            href={`${exportBase}&type=completion`}
          >
            Export completion CSV
          </a>
          <a
            className="rounded-full border border-purple-700/40 px-3 py-2 hover:border-purple-400 hover:text-white"
            href={`${exportBase}&type=at-risk`}
          >
            Export at-risk CSV
          </a>
        </div>
      </form>

      <section className="grid gap-6 md:grid-cols-3">
        <AdminCard title="Active learners" value={engagement.length} description="Users who touched content" icon={<span>🔥</span>} />
        <AdminCard title="Recent completions" value={completion.length} description="Completed subjects" icon={<span>🏆</span>} />
        <AdminCard title="At-risk" value={atRisk.length} description="Needs attention" icon={<span>⚠️</span>} />
      </section>

      <DataTable header={<span className="text-sm text-purple-200">Engagement</span>} empty="No engagement data">
        <thead className="bg-[#100822] text-xs uppercase tracking-wide text-purple-300">
          <tr>
            <th className="px-6 py-3 text-left">User</th>
            <th className="px-6 py-3 text-left">Chapters viewed</th>
            <th className="px-6 py-3 text-left">Last activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-900/40 text-sm">
          {engagement.map((row) => (
            <tr key={row.user_id} className="hover:bg-purple-950/40">
              <td className="px-6 py-3 text-white">{row.user_id}</td>
              <td className="px-6 py-3 text-purple-200">{row.chapters_viewed}</td>
              <td className="px-6 py-3 text-purple-200">{row.last_activity ? new Date(row.last_activity).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <DataTable header={<span className="text-sm text-purple-200">Completion</span>} empty="No completion data">
        <thead className="bg-[#100822] text-xs uppercase tracking-wide text-purple-300">
          <tr>
            <th className="px-6 py-3 text-left">User</th>
            <th className="px-6 py-3 text-left">Subjects completed</th>
            <th className="px-6 py-3 text-left">Last completed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-900/40 text-sm">
          {completion.map((row) => (
            <tr key={row.user_id} className="hover:bg-purple-950/40">
              <td className="px-6 py-3 text-white">{row.user_id}</td>
              <td className="px-6 py-3 text-purple-200">{row.subjects_completed}</td>
              <td className="px-6 py-3 text-purple-200">{row.last_completed ? new Date(row.last_completed).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <DataTable header={<span className="text-sm text-purple-200">At-risk students</span>} empty="No at-risk records">
        <thead className="bg-[#100822] text-xs uppercase tracking-wide text-purple-300">
          <tr>
            <th className="px-6 py-3 text-left">User</th>
            <th className="px-6 py-3 text-left">Pending enrollments</th>
            <th className="px-6 py-3 text-left">Last change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-900/40 text-sm">
          {atRisk.map((row) => (
            <tr key={row.user_id} className="hover:bg-purple-950/40">
              <td className="px-6 py-3 text-white">{row.user_id}</td>
              <td className="px-6 py-3 text-purple-200">{row.pending_enrollments}</td>
              <td className="px-6 py-3 text-purple-200">{row.last_updated ? new Date(row.last_updated).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  )
}
