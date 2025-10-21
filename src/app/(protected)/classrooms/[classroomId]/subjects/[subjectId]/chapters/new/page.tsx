'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function NewChapterPage() {
  const router = useRouter()
  const { classroomId, subjectId } = useParams<{ classroomId: string; subjectId: string }>()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'text' | 'video' | 'link'>('text')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const insert = {
      subject_id: subjectId,
      title,
      content_type: type,
      content_url: type === 'text' ? null : url,
    }

    const { error: insertError } = await supabase.from('chapters').insert([insert])
    if (insertError) {
      setError(insertError.message)
      return
    }

    setTitle('')
    setUrl('')
    startTransition(() => {
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
        <h1 className="mt-2 text-2xl font-semibold">New Chapter</h1>
        <p className="text-sm text-gray-600">
          Add a chapter to this subject. Chapters can contain text lessons, embedded videos, or links.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium">
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Introduction to Algebra"
            required
            disabled={pending}
          />
        </label>

        <label className="block text-sm font-medium">
          Type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as 'text' | 'video' | 'link')}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            disabled={pending}
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
              disabled={pending}
            />
          </label>
        )}

        <button
          type="submit"
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
          disabled={pending}
        >
          {pending ? 'Creating…' : 'Create Chapter'}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </main>
  )
}
