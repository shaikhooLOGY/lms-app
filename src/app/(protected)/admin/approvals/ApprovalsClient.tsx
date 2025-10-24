'use client'

import { useState, useTransition } from 'react'
import DataTable from '@/components/admin/DataTable'
import Drawer from '@/components/admin/Drawer'
import EmptyState from '@/components/admin/EmptyState'
import { decideApprovalAction, type ApprovalRecord } from '@/lib/actions/admin/approvals'

type ApprovalsClientProps = {
  approvals: ApprovalRecord[]
}

export default function ApprovalsClient({ approvals }: ApprovalsClientProps) {
  const [selected, setSelected] = useState<ApprovalRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleDecision(approvalId: string, decision: 'approved' | 'rejected', reason?: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('approvalId', approvalId)
      formData.append('decision', decision)
      if (reason) formData.append('reason', reason)
      const result = await decideApprovalAction(formData)
      if (result.error) setError(result.error)
      else setError(null)
    })
  }

  if (approvals.length === 0) {
    return (
      <EmptyState
        title="No pending approvals"
        description="You're all caught up. New requests will appear here."
      />
    )
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <DataTable
        header={<span className="text-sm text-purple-200">Pending approvals ({approvals.length})</span>}
        empty="No pending items"
      >
        <thead className="bg-[#100822] text-xs uppercase tracking-wide text-purple-300">
          <tr>
            <th className="px-6 py-3 text-left">Entity</th>
            <th className="px-6 py-3 text-left">Type</th>
            <th className="px-6 py-3 text-left">Requested</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-900/40 text-sm">
          {approvals.map((row) => (
            <tr key={row.id} className="hover:bg-purple-950/40">
              <td className="px-6 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-white">{row.entity_id}</span>
                  <span className="text-xs text-purple-300">{row.id}</span>
                </div>
              </td>
              <td className="px-6 py-3 text-purple-200 capitalize">{row.entity_type}</td>
              <td className="px-6 py-3 text-purple-200">{new Date(row.created_at).toLocaleString()}</td>
              <td className="px-6 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(row)}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(row.id, 'approved')}
                    disabled={pending}
                    className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200 hover:border-emerald-400 hover:text-emerald-100"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(row.id, 'rejected')}
                    disabled={pending}
                    className="rounded-full border border-red-500/50 px-3 py-1 text-xs text-red-200 hover:border-red-400 hover:text-red-100"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.entity_type} ${selected.entity_id}` : ''}
        description="Review approval details"
      >
        {selected ? (
          <div className="space-y-4 text-sm text-purple-100">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-purple-300">Metadata</h3>
              <pre className="mt-2 overflow-auto rounded-xl border border-purple-800/40 bg-[#120a24] p-4 text-xs text-purple-200">
                {JSON.stringify(selected.meta ?? {}, null, 2)}
              </pre>
            </div>
            <form
              action={(formData) => {
                const reason = (formData.get('reason') as string | null) ?? undefined
                handleDecision(selected.id, 'rejected', reason)
              }}
              className="space-y-3"
            >
              <label className="text-xs uppercase tracking-wide text-purple-300">Reject with reason</label>
              <textarea
                name="reason"
                rows={3}
                className="w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
                placeholder="Optional explanation"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-full border border-red-500/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 hover:border-red-400 hover:text-red-100"
              >
                Reject with reason
              </button>
            </form>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
