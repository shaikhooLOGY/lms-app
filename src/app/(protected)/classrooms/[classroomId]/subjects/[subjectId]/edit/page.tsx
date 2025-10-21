'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState, useTransition } from 'react'
import { supabase } from '@/lib/supabaseClient'

type SubjectRow = {
  id: string
  name: string
  description: string | null
}

export default function EditSubjectPage() {
  const router = useRouter()
  const { classroomId, subjectId } = useParams<{ classroomId: string; subjectId: string }>()
  const [subject, setSubject] = useState<SubjectRow | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, startTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('id, name, description')
        .eq('id', subjectId)
        .maybeSingle()

      if (!active) return

      if (fetchError) {
        setError(fetchError.message)
        setSubject(null)
      } else if (data) {
        const row: SubjectRow = {
          id: data.id as string,
          name: data.name as string,
          description: (data.description as string | null) ?? null,
        }
        setSubject(row)
        setName(row.name)
        setDescription(row.description ?? '')
        setError(null)
      } else {
        setSubject(null)
        setError('Subject not found.')
      }
      setLoading(false)
    }

    if (subjectId) load()
    return () => {
      active = false
    }
  }, [subjectId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!subject) return
    setError(null)

    const { error: updateError } = await supabase
      .from('subjects')
      .update({ name, description: description || null })
      .eq('id', subject.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    startTransition(() => {
      router.replace(`/classrooms/${classroomId}/subjects`)
      router.refresh()
    })
  }

  async function handleDelete() {
    if (!subject) return
    const confirmation = window.confirm(
      'Delete this subject? Chapters and related content may become inaccessible.'
    )
    if (!confirmation) return

    setError(null)
    const { error: deleteError } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subject.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    startDeleteTransition(() => {
      router.replace(`/classrooms/${classroomId}/subjects`)
      router.refresh()
    })
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <Link
          href={`/classrooms/${classroomId}/subjects`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Subjects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit Subject</h1>
        <p className="text-sm text-gray-600">
          Update subject details or remove the subject from this classroom.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Loading subject…</p>
      ) : subject ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <label className="block text-sm font-medium">
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
              disabled={pending || deletePending}
            />
          </label>

          <label className="block text-sm font-medium">
            Description <span className="font-normal text-gray-500">(optional)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              rows={4}
              disabled={pending || deletePending}
            />
          </label>

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
              {deletePending ? 'Deleting…' : 'Delete Subject'}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <p className="text-sm text-gray-600">
          {error ?? 'Subject not available or already deleted.'}
        </p>
      )}
    </main>
  )
}
