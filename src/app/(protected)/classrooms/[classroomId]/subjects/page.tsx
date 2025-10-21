'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Subject = {
  id: string
  name: string
  description: string | null
}

export default function SubjectsPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('id, name, description')
        .eq('classroom_id', classroomId)
        .order('order_no', { ascending: true })

      if (!active) return

      if (fetchError) {
        setError(fetchError.message)
        setSubjects([])
      } else {
        setError(null)
        setSubjects(data ?? [])
      }
      setLoading(false)
    }
    if (classroomId) load()
    return () => {
      active = false
    }
  }, [classroomId])

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/classrooms" className="text-sm text-blue-600 hover:underline">
            ← Back to Classrooms
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Subjects</h1>
          <p className="text-sm text-gray-600">
            Subjects inside this classroom. Create lessons and organize content per subject.
          </p>
        </div>
        <Link
          href={`/classrooms/${classroomId}/subjects/new`}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
        >
          New Subject
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-600">Loading subjects…</p>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-gray-600">No subjects yet. Create one to get started.</p>
      ) : (
        <ul className="space-y-3">
          {subjects.map((subject) => (
            <li key={subject.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-medium">{subject.name}</div>
                  {subject.description && (
                    <p className="text-sm text-gray-600">{subject.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/classrooms/${classroomId}/subjects/${subject.id}/chapters`}
                    className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    Manage Chapters
                  </Link>
                  <Link
                    href={`/classrooms/${classroomId}/subjects/${subject.id}/edit`}
                    className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-black/5"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
