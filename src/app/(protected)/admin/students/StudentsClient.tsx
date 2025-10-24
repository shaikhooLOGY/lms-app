'use client'

import { useState, useTransition } from 'react'
import DataTable from '@/components/admin/DataTable'
import Drawer from '@/components/admin/Drawer'
import EmptyState from '@/components/admin/EmptyState'
import { AdminMemberRecord, removeMemberAction, updateMemberRoleAction } from '@/lib/actions/admin/memberships'

const promoteOptions = [
  { label: 'Promote to Teacher', value: 'teacher' },
  { label: 'Promote to Admin', value: 'admin' },
]

const disciplineOptions = [
  { label: 'Suspend', value: 'banned' },
  { label: 'Blacklist', value: 'banned' },
]

type StudentsClientProps = {
  tenantId: string
  members: AdminMemberRecord[]
}

export default function StudentsClient({ tenantId, members }: StudentsClientProps) {
  const [selected, setSelected] = useState<AdminMemberRecord | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRoleChange(userId: string, role: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('tenantId', tenantId)
      formData.append('userId', userId)
      formData.append('role', role)
      const result = await updateMemberRoleAction(formData)
      if (result.error) setError(result.error)
      else setError(null)
    })
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('tenantId', tenantId)
      formData.append('userId', userId)
      const result = await removeMemberAction(formData)
      if (result.error) setError(result.error)
      else setError(null)
    })
  }

  if (members.length === 0) {
    return (
      <EmptyState title="No students" description="Enroll learners to populate this list." />
    )
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <DataTable
        header={<span className="text-sm text-purple-200">Total {members.length} students</span>}
        empty="No students"
      >
        <thead className="bg-[#100822] text-xs uppercase tracking-wide text-purple-300">
          <tr>
            <th className="px-6 py-3 text-left">Learner</th>
            <th className="px-6 py-3 text-left">Joined</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-900/40 text-sm">
          {members.map((member) => (
            <tr key={member.user_id} className="hover:bg-purple-950/40">
              <td className="px-6 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-white">{member.full_name ?? member.email ?? 'Unknown user'}</span>
                  <span className="text-xs text-purple-300">{member.email ?? 'No email'}</span>
                </div>
              </td>
              <td className="px-6 py-3 text-purple-200">
                {member.joined_at ? new Date(member.joined_at).toLocaleString() : '—'}
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(member)}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    View
                  </button>
                  <Dropdown
                    label="Promote"
                    options={promoteOptions}
                    disabled={pending}
                    onSelect={(value) => handleRoleChange(member.user_id, value)}
                  />
                  <Dropdown
                    label="Discipline"
                    options={disciplineOptions}
                    disabled={pending}
                    onSelect={(value) => handleRoleChange(member.user_id, value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(member.user_id)}
                    disabled={pending}
                    className="rounded-full border border-red-500/50 px-3 py-1 text-xs text-red-200 hover:border-red-400 hover:text-red-100"
                  >
                    Remove
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
        title={selected?.full_name ?? selected?.email ?? 'Learner'}
        description="Student profile"
      >
        {selected ? (
          <div className="space-y-4 text-sm text-purple-100">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-purple-300">Details</h3>
              <dl className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <dt className="text-purple-300">User ID</dt>
                  <dd className="text-white">{selected.user_id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-purple-300">Email</dt>
                  <dd>{selected.email ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-purple-300">Joined</dt>
                  <dd>{selected.joined_at ? new Date(selected.joined_at).toLocaleString() : '—'}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

function Dropdown({
  label,
  options,
  onSelect,
  disabled,
}: {
  label: string
  options: Array<{ label: string; value: string }>
  onSelect: (value: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
      >
        {label}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-purple-800/50 bg-[#110a1f] p-1 text-xs text-white shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="block w-full rounded-lg px-3 py-2 text-left capitalize hover:bg-purple-700/40"
              onClick={() => {
                onSelect(option.value)
                setOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
