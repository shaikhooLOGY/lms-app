'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createClassroomAction, type ClassroomFormState } from '@/lib/actions/classrooms'

type ClassroomCreateFormProps = {
  disabled: boolean
  initialState: ClassroomFormState
  superAdmin: boolean
}

export default function ClassroomCreateForm({ disabled, initialState, superAdmin }: ClassroomCreateFormProps) {
  const [state, formAction] = useFormState(createClassroomAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</div>
      ) : (
        <p className="text-sm text-gray-500">
          {disabled
            ? superAdmin
              ? 'Select an institute from the profile menu before creating a classroom.'
              : 'You need access to an institute before creating classrooms.'
            : 'Classrooms start as drafts; you can publish them from the admin list.'}
        </p>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Classroom title
          <input
            type="text"
            name="title"
            required
            disabled={disabled}
            placeholder="e.g. Grade 8 Mathematics"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Description
          <textarea
            name="description"
            rows={4}
            disabled={disabled}
            placeholder="Optional summary for learners"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </label>
      </div>

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? 'Creating…' : 'Create classroom'}
    </button>
  )
}
