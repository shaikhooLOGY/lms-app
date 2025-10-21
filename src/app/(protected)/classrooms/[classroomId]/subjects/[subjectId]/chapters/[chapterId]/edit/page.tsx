'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState, useTransition } from 'react'
import { supabase } from '@/lib/supabaseClient'

type ChapterRow = {
  id: string
  title: string
  content_type: 'text' | 'video' | 'link'
  content_url: string | null
}

export default function EditChapterPage() {
  const router = useRouter()
  const { classroomId, subjectId, chapterId } = useParams<{
    classroomId: string
    subjectId: string
    chapterId: string
  }>()
  const [chapter, setChapter] = useState<ChapterRow | null>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'text' | 'video' | 'link'>('text')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, startTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('chapters')
        .select('id, title, content_type, content_url')
        .eq('id', chapterId)
        .maybeSingle()

      if (!active) return

      if (fetchError) {
        setError(fetchError.message)
        setChapter(null)
      } else if (data) {
        const row = {
          id: data.id as string,
          title: data.title as string,
          content_type: data.content_type as 'text' | 'video' | 'link',
          content_url: (data.content_url as string | null) ?? null,
        }
        setChapter(row)
        setTitle(row.title)
        setType(row.content_type)
        setUrl(row.content_url ?? '')
        setError(null)
      } else {
        setChapter(null)
        setError('Chapter not found.')
      }
      setLoading(false)
    }

    if (chapterId) load()
    return () => {
      active = false
    }
  }, [chapterId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!chapter) return
    setError(null)

    const updatePayload = {
      title,
      content_type: type,
      content_url: type === 'text' ? null : url,
    }

    const { error: updateError } = await supabase
      .from('chapters')
      .update(updatePayload)
      .eq('id', chapter.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    startTransition(() => {
      router.replace(`/classrooms/${classroomId}/subjects/${subjectId}/chapters`)
      router.refresh()
    })
  }

  async function handleDelete() {
    if (!chapter) return
    const confirmation = window.confirm('Delete this chapter permanently?')
    if (!confirmation) return

    setError(null)
    const { error: deleteError } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapter.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    startDeleteTransition(() => {
      router.replace(`/classrooms/${classroomId}/subjects/${subjectId}/chapters`)
      router.refresh()
    })
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <Link
          href={`/classrooms/${classroomId}/subjects/${subjectId}/chapters`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Chapters
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit Chapter</h1>
        <p className="text-sm text-gray-600">
          Update chapter details or remove it from this subject.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Loading chapter…</p>
      ) : chapter ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <label className="block text-sm font-medium">
            Title
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
              disabled={pending || deletePending}
            />
          </label>

          <label className="block text-sm font-medium">
            Type
            <select
              value={type}
              onChange={(event) => setType(event.target.value as 'text' | 'video' | 'link')}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={pending || deletePending}
            >
              <option value="text">Text</option>
              <option value="video">Video (embed URL)</option>
              <option value="link">External Link</option>
            </select>
          </label>

          {type !== 'text' && (
            <label className="block text-sm font-medium">
              Content URL
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="https://..."
                required
                disabled={pending || deletePending}
              />
            </label>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
              disabled={pending || deletePending}
            >
              {pending ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              disabled={pending || deletePending}
            >
              {deletePending ? 'Deleting…' : 'Delete Chapter'}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <p className="text-sm text-gray-600">{error ?? 'Chapter not found.'}</p>
      )}
    </main>
  )
}
