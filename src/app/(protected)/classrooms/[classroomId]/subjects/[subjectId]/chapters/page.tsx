'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Chapter = {
  id: string
  title: string
  content_type: 'text' | 'video' | 'link'
  content_url: string | null
}

export default function ChaptersPage() {
  const { classroomId, subjectId } = useParams<{ classroomId: string; subjectId: string }>()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('chapters')
        .select('id, title, content_type, content_url')
        .eq('subject_id', subjectId)
        .order('order_no', { ascending: true })

      if (!active) return

      if (fetchError) {
        setError(fetchError.message)
        setChapters([])
      } else {
        setError(null)
        const rows = Array.isArray(data) ? data : []
        setChapters(
          rows.map((row) => ({
            id: row.id as string,
            title: row.title as string,
            content_type: row.content_type as 'text' | 'video' | 'link',
            content_url: (row.content_url as string | null) ?? null,
          }))
        )
      }
      setLoading(false)
    }
    if (subjectId) load()
    return () => {
      active = false
    }
  }, [subjectId])

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href={`/classrooms/${classroomId}/subjects`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Subjects
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Chapters</h1>
          <p className="text-sm text-gray-600">
            Chapters hold the learning content students consume for this subject.
          </p>
        </div>
        <Link
          href={`/classrooms/${classroomId}/subjects/${subjectId}/chapters/new`}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
        >
          New Chapter
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-600">Loading chapters…</p>
      ) : chapters.length === 0 ? (
        <p className="text-sm text-gray-600">No chapters yet. Create one to add content.</p>
      ) : (
        <ul className="space-y-3">
          {chapters.map((chapter) => (
            <li key={chapter.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-medium">{chapter.title}</div>
                  <p className="text-sm text-gray-600 capitalize">
                    Type: {chapter.content_type}
                    {chapter.content_url ? (
                      <>
                        {' · '}
                        <a
                          href={chapter.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View resource
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/classrooms/${classroomId}/subjects/${subjectId}/chapters/${chapter.id}/edit`}
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
