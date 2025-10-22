'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createClassroomAction, type ClassroomFormState } from '@/lib/actions/classrooms'
import { Button } from '@/components/ui/button'

const initialState: ClassroomFormState = {}

type Props = {
  canCreate: boolean
}

export default function ClassroomCreateForm({ canCreate }: Props) {
  const [state, formAction] = useFormState(createClassroomAction, initialState)

  if (!canCreate) return null

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <form action={formAction} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="text-sm font-medium">
          Name
          <input
            name="title"
            type="text"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Physics 101"
          />
        </label>
        <SubmitButton />
        <label className="sm:col-span-2 text-sm font-medium">
          Description <span className="font-normal text-gray-400">(optional)</span>
          <textarea
            name="description"
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Outline what students will learn."
          />
        </label>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-green-600">Classroom created!</p>}
    </section>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="px-4 py-2">
      {pending ? 'Creating…' : 'Create classroom'}
    </Button>
  )
}
