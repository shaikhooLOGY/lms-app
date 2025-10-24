'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import DataTable from '@/components/admin/DataTable'
import Drawer from '@/components/admin/Drawer'
import EmptyState from '@/components/admin/EmptyState'
import FormModal from '@/components/admin/FormModal'
import { changeClassroomStatusAction, deleteClassroomAction, upsertClassroomAction, type AdminClassroomRecord } from '@/lib/actions/admin/classrooms'
import { classroomStatuses } from '@/lib/actions/admin/classrooms.shared'

type Props = {
  records: AdminClassroomRecord[]
}

export default function ClassroomsClient({ records }: Props) {
  const [selected, setSelected] = useState<AdminClassroomRecord | null>(null)
  const [editing, setEditing] = useState<AdminClassroomRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (classroom: AdminClassroomRecord) => {
    setEditing(classroom)
    setModalOpen(true)
  }

  function handleStatusChange(classroomId: string, status: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('classroomId', classroomId)
      formData.append('status', status)
      const result = await changeClassroomStatusAction(formData)
      if (result.error) {
        setStatusError(result.error)
        return
      }
      setStatusError(null)
    })
  }

  function handleDelete(classroomId: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('classroomId', classroomId)
      const result = await deleteClassroomAction(formData)
      if (result.error) {
        setStatusError(result.error)
        return
      }
      setStatusError(null)
    })
  }

  if (records.length === 0) {
    return (
      <EmptyState
        title="No classrooms yet"
        description="Create your first classroom to begin assigning subjects and lessons."
        action={<ClassroomButton variant="primary" onClick={openCreate} />}
      />
    )
  }

  return (
    <div className="space-y-4">
      {statusError ? <p className="text-sm text-red-400">{statusError}</p> : null}
      <DataTable
        header={
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <span>Total {records.length} classrooms</span>
            <ClassroomButton onClick={openCreate} />
          </div>
        }
        empty="No classrooms"
      >
        <thead className="bg-[#100822] text-xs uppercase tracking-wide text-purple-300">
          <tr>
            <th className="px-6 py-3 text-left">Title</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">Capacity</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-900/40 text-sm">
          {records.map((classroom) => (
            <tr key={classroom.id} className="hover:bg-purple-950/40">
              <td className="px-6 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-white">{classroom.title}</span>
                  <span className="text-xs text-purple-300">{classroom.id}</span>
                </div>
              </td>
              <td className="px-6 py-3">
                <StatusBadge status={classroom.status} />
              </td>
              <td className="px-6 py-3 text-purple-200">
                {classroom.capacity ?? '—'}
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(classroom)}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(classroom)}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    Edit
                  </button>
                  <Dropdown
                    disabled={pending}
                    onSelect={(value) => handleStatusChange(classroom.id, value)}
                    options={classroomStatuses.filter((status) => status !== 'all')}
                    label="Status"
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(classroom.id)}
                    disabled={pending}
                    className="rounded-full border border-red-500/50 px-3 py-1 text-xs text-red-200 hover:border-red-400 hover:text-red-100"
                  >
                    Ban
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title ?? ''} description={selected ? `Status: ${selected.status}` : ''}>
        {selected ? (
          <div className="space-y-4 text-sm text-purple-100">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-purple-300">Overview</h3>
              <dl className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <dt className="text-purple-300">Classroom ID</dt>
                  <dd className="text-white">{selected.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-purple-300">Created</dt>
                  <dd>{new Date(selected.created_at).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-purple-300">Capacity</dt>
                  <dd>{selected.capacity ?? '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wide text-purple-300">Related</h3>
              <Link
                href={`/admin/classrooms/${selected.id}/subjects`}
                className="inline-flex items-center gap-2 rounded-full border border-purple-700/40 px-4 py-1.5 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-400 hover:text-white"
              >
                Manage subjects
              </Link>
            </div>
          </div>
        ) : null}
      </Drawer>

      <ClassroomModal
        key={editing?.id ?? 'new'}
        classroom={editing}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

function ClassroomButton({ variant = 'outline', onClick }: { variant?: 'outline' | 'primary'; onClick: () => void }) {
  const className = useMemo(() => {
    if (variant === 'primary') {
      return 'rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500'
    }
    return 'rounded-full border border-purple-700/40 px-4 py-2 text-sm font-medium uppercase tracking-wide text-purple-200 transition hover:border-purple-400 hover:text-white'
  }, [variant])

  return (
    <button type="button" onClick={onClick} className={className}>
      New classroom
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-500/30 text-slate-200',
    pending_review: 'bg-yellow-500/20 text-yellow-200',
    published: 'bg-emerald-500/20 text-emerald-200',
    rejected: 'bg-orange-500/20 text-orange-200',
    banned: 'bg-red-600/30 text-red-200',
  }
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${map[status] ?? 'bg-purple-600/20 text-purple-100'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function Dropdown({ options, onSelect, label, disabled }: { options: string[]; onSelect: (value: string) => void; label: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

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
        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-purple-800/50 bg-[#110a1f] p-1 text-xs text-white shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className="block w-full rounded-lg px-3 py-2 text-left capitalize hover:bg-purple-700/40"
              onClick={() => {
                onSelect(option)
                setOpen(false)
              }}
            >
              {option.replace('_', ' ')}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ClassroomModal({ classroom, open, onClose }: { classroom: AdminClassroomRecord | null; open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState(classroom?.title ?? '')
  const [description, setDescription] = useState(classroom?.description ?? '')
  const [capacity, setCapacity] = useState(classroom?.capacity?.toString() ?? '')
  const [educatorId, setEducatorId] = useState(classroom?.educator_id ?? '')
  const [status, setStatus] = useState(classroom?.status ?? 'draft')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setTitle(classroom?.title ?? '')
    setDescription(classroom?.description ?? '')
    setCapacity(classroom?.capacity?.toString() ?? '')
    setEducatorId(classroom?.educator_id ?? '')
    setStatus(classroom?.status ?? 'draft')
  }, [classroom])

  if (!open) return null

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertClassroomAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      onClose()
    })
  }

  return (
    <FormModal open={open} onClose={onClose} title={classroom?.id ? 'Edit classroom' : 'New classroom'}>
      <form action={handleSubmit} className="space-y-4">
        {classroom?.id ? <input type="hidden" name="id" value={classroom.id} /> : null}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-purple-300">Title</label>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-purple-300">Description</label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
            placeholder="Optional summary"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs uppercase tracking-wide text-purple-300">
            Capacity
            <input
              name="capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="30"
              className="mt-1 w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-purple-300">
            Educator ID
            <input
              name="educatorId"
              value={educatorId}
              onChange={(e) => setEducatorId(e.target.value)}
              placeholder="Optional user id"
              className="mt-1 w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
            />
          </label>
        </div>
        {classroom?.id ? (
          <label className="text-xs uppercase tracking-wide text-purple-300">
            Status
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
            >
              {classroomStatuses
                .filter((value) => value !== 'all')
                .map((value) => (
                  <option key={value} value={value} className="bg-[#0d0818]">
                    {value.replace('_', ' ')}
                  </option>
                ))}
            </select>
          </label>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
        >
          {pending ? 'Saving…' : classroom?.id ? 'Update classroom' : 'Create classroom'}
        </button>
      </form>
    </FormModal>
  )
}
