'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import DataTable from '@/components/admin/DataTable'
import Drawer from '@/components/admin/Drawer'
import EmptyState from '@/components/admin/EmptyState'
import FormModal from '@/components/admin/FormModal'
import {
  AdminSubjectRecord,
  deleteSubjectAction,
  reorderSubjectsAction,
  upsertSubjectAction,
} from '@/lib/actions/admin/subjects'
import { subjectStatusEnum } from '@/lib/validators/subject'

export type SubjectClientProps = {
  classroomId: string
  classroomName: string
  subjects: AdminSubjectRecord[]
}

export default function SubjectsClient({ classroomId, classroomName, subjects }: SubjectClientProps) {
  const [items, setItems] = useState(subjects)
  const [selected, setSelected] = useState<AdminSubjectRecord | null>(null)
  const [editing, setEditing] = useState<AdminSubjectRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setItems(subjects)
  }, [subjects])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (subject: AdminSubjectRecord) => {
    setEditing(subject)
    setModalOpen(true)
  }

  function handleDelete(subjectId: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('id', subjectId)
      const result = await deleteSubjectAction(formData)
      if (result.error) {
        setStatusError(result.error)
        return
      }
      setStatusError(null)
    })
  }

  function handleDragStart(index: number) {
    setDraggingIndex(index)
  }

  function handleDragOver(event: React.DragEvent<HTMLTableRowElement>) {
    event.preventDefault()
  }

  function handleDrop(index: number) {
    if (draggingIndex === null || draggingIndex === index) return
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(draggingIndex, 1)
      next.splice(index, 0, moved)

      const formData = new FormData()
      formData.append('classroomId', classroomId)
      formData.append('orderedIds', JSON.stringify(next.map((subject) => subject.id)))
      startTransition(async () => {
        const result = await reorderSubjectsAction(formData)
        if (result.error) {
          setStatusError(result.error)
        }
      })

      return next
    })
    setDraggingIndex(null)
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No subjects"
        description="Create your first subject to organise lessons for this classroom."
        action={<SubjectButton variant="primary" onClick={openCreate} />}
      />
    )
  }

  return (
    <div className="space-y-4">
      {statusError ? <p className="text-sm text-red-400">{statusError}</p> : null}
      <DataTable
        header={
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <div>
              <span className="text-sm text-purple-200">
                {items.length} subjects · Classroom: <span className="font-semibold text-white">{classroomName}</span>
              </span>
            </div>
            <SubjectButton onClick={openCreate} />
          </div>
        }
        empty="No subjects"
      >
        <thead className="bg-[#100822] text-xs uppercase tracking-wide text-purple-300">
          <tr>
            <th className="px-6 py-3 text-left">Subject</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">Lessons</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-900/40 text-sm">
          {items.map((subject, index) => (
            <tr
              key={subject.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className="cursor-move hover:bg-purple-950/40"
            >
              <td className="px-6 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-white">{subject.title}</span>
                  <span className="text-xs text-purple-300">{subject.id}</span>
                </div>
              </td>
              <td className="px-6 py-3">
                <StatusBadge status={subject.status} />
              </td>
              <td className="px-6 py-3 text-purple-200">{subject.lessons_count}</td>
              <td className="px-6 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(subject)}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(subject)}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(subject.id)}
                    disabled={pending}
                    className="rounded-full border border-red-500/50 px-3 py-1 text-xs text-red-200 hover:border-red-400 hover:text-red-100"
                  >
                    Archive
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
        title={selected?.title ?? ''}
        description={selected ? `Status: ${selected.status}` : ''}
      >
        {selected ? (
          <div className="space-y-6 text-sm text-purple-100">
            <section>
              <h3 className="text-xs uppercase tracking-wide text-purple-300">Overview</h3>
              <dl className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <dt className="text-purple-300">Subject ID</dt>
                  <dd className="text-white">{selected.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-purple-300">Lessons</dt>
                  <dd>{selected.lessons_count}</dd>
                </div>
              </dl>
            </section>
            {selected.description ? (
              <section>
                <h3 className="text-xs uppercase tracking-wide text-purple-300">Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-purple-100/90">{selected.description}</p>
              </section>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <SubjectModal
        key={editing?.id ?? 'new'}
        classroomId={classroomId}
        subject={editing}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

function SubjectButton({ variant = 'outline', onClick }: { variant?: 'outline' | 'primary'; onClick: () => void }) {
  const className = useMemo(() => {
    if (variant === 'primary') {
      return 'rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500'
    }
    return 'rounded-full border border-purple-700/40 px-4 py-2 text-sm font-medium uppercase tracking-wide text-purple-200 transition hover:border-purple-400 hover:text-white'
  }, [variant])

  return (
    <button type="button" onClick={onClick} className={className}>
      New subject
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-500/30 text-slate-200',
    published: 'bg-emerald-500/20 text-emerald-200',
    archived: 'bg-gray-500/20 text-gray-200',
  }
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${map[status] ?? 'bg-purple-600/20 text-purple-100'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function SubjectModal({
  classroomId,
  subject,
  open,
  onClose,
}: {
  classroomId: string
  subject: AdminSubjectRecord | null
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState(subject?.title ?? '')
  const [description, setDescription] = useState(subject?.description ?? '')
  const [status, setStatus] = useState(subject?.status ?? 'draft')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setTitle(subject?.title ?? '')
    setDescription(subject?.description ?? '')
    setStatus(subject?.status ?? 'draft')
  }, [subject])

  if (!open) return null

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertSubjectAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      onClose()
    })
  }

  return (
    <FormModal open={open} onClose={onClose} title={subject ? 'Edit subject' : 'New subject'}>
      <form action={handleSubmit} className="space-y-4">
        {subject ? <input type="hidden" name="id" value={subject.id} /> : null}
        <input type="hidden" name="classroomId" value={classroomId} />
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
        {subject ? (
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-purple-300">Status</label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
            >
              {subjectStatusEnum.options.map((option) => (
                <option key={option} value={option} className="bg-[#0d0818]">
                  {option.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
        >
          {pending ? 'Saving…' : subject ? 'Update subject' : 'Create subject'}
        </button>
      </form>
    </FormModal>
  )
}
