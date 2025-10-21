'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  tenantId: string
}

export default function ClassroomCreateForm({ tenantId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const { error: insertError } = await supabase
      .from('classrooms')
      .insert([{ tenant_id: tenantId, title }])

    if (insertError) {
      setError(insertError.message)
      return
    }

    setTitle('')
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium">
          Name
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base"
            placeholder="Physics 101"
            required
            disabled={pending}
          />
        </label>
        <button
          type="submit"
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
          disabled={pending}
        >
          {pending ? 'Creating…' : 'Create Classroom'}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  )
}
