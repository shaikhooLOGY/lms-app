'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function NewSubjectPage() {
  const router = useRouter()
  const { classroomId } = useParams<{ classroomId: string }>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const { error: insertError } = await supabase
      .from('subjects')
      .insert([{ classroom_id: classroomId, name, description: description || null }])

    if (insertError) {
      setError(insertError.message)
      return
    }

    startTransition(() => {
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
        <h1 className="mt-2 text-2xl font-semibold">New Subject</h1>
        <p className="text-sm text-gray-600">
          Create a subject to organize chapters for this classroom.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium">
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Mathematics"
            required
            disabled={pending}
          />
        </label>

        <label className="block text-sm font-medium">
          Description <span className="font-normal text-gray-500">(optional)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            rows={4}
            placeholder="What will students learn in this subject?"
            disabled={pending}
          />
        </label>

        <button
          type="submit"
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
          disabled={pending}
        >
          {pending ? 'Creating…' : 'Create Subject'}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </main>
  )
}
