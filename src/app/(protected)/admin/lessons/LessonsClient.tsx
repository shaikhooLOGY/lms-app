'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import DataTable from '@/components/admin/DataTable'
import Drawer from '@/components/admin/Drawer'
import EmptyState from '@/components/admin/EmptyState'
import FormModal from '@/components/admin/FormModal'
import {
  AdminLessonRecord,
  deleteLessonAction,
  reorderLessonsAction,
  upsertLessonAction,
} from '@/lib/actions/admin/lessons'
import { lessonTypeEnum } from '@/lib/validators/lesson'

export type LessonsClientProps = {
  subjectId: string
  subjectTitle: string
  lessons: AdminLessonRecord[]
}

export default function LessonsClient({ subjectId, subjectTitle, lessons }: LessonsClientProps) {
  const [items, setItems] = useState(lessons)
  const [selected, setSelected] = useState<AdminLessonRecord | null>(null)
  const [editing, setEditing] = useState<AdminLessonRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setItems(lessons)
  }, [lessons])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (lesson: AdminLessonRecord) => {
    setEditing(lesson)
    setModalOpen(true)
  }

  function handleDelete(lessonId: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('id', lessonId)
      const result = await deleteLessonAction(formData)
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
      formData.append('subjectId', subjectId)
      formData.append('orderedIds', JSON.stringify(next.map((lesson) => lesson.id)))
      startTransition(async () => {
        const result = await reorderLessonsAction(formData)
        if (result.error) setStatusError(result.error)
      })

      return next
    })
    setDraggingIndex(null)
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No lessons"
        description="Create lessons to populate this subject."
        action={<LessonButton variant="primary" onClick={openCreate} />}
      />
    )
  }

  return (
    <div className="space-y-4">
      {statusError ? <p className="text-sm text-red-400">{statusError}</p> : null}
      <DataTable
        header={
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <span className="text-sm text-purple-200">
              {items.length} lessons · Subject: <span className="font-semibold text-white">{subjectTitle}</span>
            </span>
            <LessonButton onClick={openCreate} />
          </div>
        }
        empty="No lessons"
      >
        <thead className="bg-[#100822] text-xs uppercase tracking-wide text-purple-300">
          <tr>
            <th className="px-6 py-3 text-left">Lesson</th>
            <th className="px-6 py-3 text-left">Type</th>
            <th className="px-6 py-3 text-left">Duration</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-900/40 text-sm">
          {items.map((lesson, index) => (
            <tr
              key={lesson.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className="cursor-move hover:bg-purple-950/40"
            >
              <td className="px-6 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-white">{lesson.title}</span>
                  <span className="text-xs text-purple-300">{lesson.id}</span>
                </div>
              </td>
              <td className="px-6 py-3 text-purple-200 capitalize">{lesson.content_type ?? '—'}</td>
              <td className="px-6 py-3 text-purple-200">{lesson.duration_minutes ?? '—'}</td>
              <td className="px-6 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(lesson)}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(lesson)}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(lesson.id)}
                    disabled={pending}
                    className="rounded-full border border-red-500/50 px-3 py-1 text-xs text-red-200 hover:border-red-400 hover:text-red-100"
                  >
                    Delete
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
        description={selected ? `Type: ${selected.content_type ?? 'unknown'}` : ''}
      >
        {selected ? <LessonPreview lesson={selected} /> : null}
      </Drawer>

      <LessonModal
        key={editing?.id ?? 'new'}
        lesson={editing}
        subjectId={subjectId}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

function LessonButton({ variant = 'outline', onClick }: { variant?: 'outline' | 'primary'; onClick: () => void }) {
  const className = useMemo(() => {
    if (variant === 'primary') {
      return 'rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500'
    }
    return 'rounded-full border border-purple-700/40 px-4 py-2 text-sm font-medium uppercase tracking-wide text-purple-200 transition hover:border-purple-400 hover:text-white'
  }, [variant])

  return (
    <button type="button" onClick={onClick} className={className}>
      New lesson
    </button>
  )
}

function LessonPreview({ lesson }: { lesson: AdminLessonRecord }) {
  return (
    <div className="space-y-6 text-sm text-purple-100">
      <section>
        <h3 className="text-xs uppercase tracking-wide text-purple-300">Overview</h3>
        <dl className="mt-2 space-y-2">
          <div className="flex justify-between">
            <dt className="text-purple-300">Lesson ID</dt>
            <dd className="text-white">{lesson.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-purple-300">Duration</dt>
            <dd>{lesson.duration_minutes ?? '—'} minutes</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-purple-300">Free preview</dt>
            <dd>{lesson.is_free_preview ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </section>
      {lesson.content_type === 'video' && lesson.video_url ? (
        <section className="space-y-2">
          <h3 className="text-xs uppercase tracking-wide text-purple-300">Video</h3>
          <div className="aspect-video overflow-hidden rounded-xl border border-purple-800/40">
            <iframe
              src={lesson.video_url}
              title={lesson.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}
      {lesson.content_md ? (
        <section>
          <h3 className="text-xs uppercase tracking-wide text-purple-300">Content</h3>
          <div className="whitespace-pre-wrap rounded-xl border border-purple-800/40 bg-[#120a24] p-4 text-sm text-purple-100">
            {lesson.content_md}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function LessonModal({
  lesson,
  subjectId,
  open,
  onClose,
}: {
  lesson: AdminLessonRecord | null
  subjectId: string
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [type, setType] = useState<string>(lesson?.content_type ?? 'video')
  const [description, setDescription] = useState(lesson?.content_md ?? '')
  const [duration, setDuration] = useState(lesson?.duration_minutes?.toString() ?? '')
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url ?? '')
  const [isFreePreview, setIsFreePreview] = useState(Boolean(lesson?.is_free_preview))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setTitle(lesson?.title ?? '')
    setType(lesson?.content_type ?? 'video')
    setDescription(lesson?.content_md ?? '')
    setDuration(lesson?.duration_minutes?.toString() ?? '')
    setVideoUrl(lesson?.video_url ?? '')
    setIsFreePreview(Boolean(lesson?.is_free_preview))
  }, [lesson])

  if (!open) return null

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertLessonAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      onClose()
    })
  }

  return (
    <FormModal open={open} onClose={onClose} title={lesson ? 'Edit lesson' : 'New lesson'}>
      <form action={handleSubmit} className="space-y-4">
        {lesson ? <input type="hidden" name="id" value={lesson.id} /> : null}
        <input type="hidden" name="subjectId" value={subjectId} />
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
          <label className="text-xs uppercase tracking-wide text-purple-300">Type</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
          >
            {lessonTypeEnum.options.map((option) => (
              <option key={option} value={option} className="bg-[#0d0818]">
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs uppercase tracking-wide text-purple-300">
            Duration (minutes)
            <input
              name="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1 w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
              placeholder="e.g. 45"
            />
          </label>
          {type === 'video' ? (
            <label className="text-xs uppercase tracking-wide text-purple-300">
              Video URL
              <input
                name="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="mt-1 w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
                placeholder="https://..."
              />
            </label>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-purple-300">
          <input
            type="checkbox"
            name="isFreePreview"
            checked={isFreePreview}
            onChange={(e) => setIsFreePreview(e.target.checked)}
            className="h-4 w-4 rounded border-purple-700/60 bg-transparent text-purple-500 focus:ring-purple-400"
          />
          Free preview
        </label>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-purple-300">Description / Content</label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
            placeholder="Markdown-supported content"
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
        >
          {pending ? 'Saving…' : lesson ? 'Update lesson' : 'Create lesson'}
        </button>
      </form>
    </FormModal>
  )
}
