'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setViewMode } from '@/actions/mode'
import type { ViewMode } from '@/lib/permissions'

type ModeToggleProps = {
  initialMode: ViewMode
}

export default function ModeToggle({ initialMode }: ModeToggleProps) {
  const router = useRouter()
  const [mode, setMode] = useState<ViewMode>(initialMode)
  const [pending, startTransition] = useTransition()

  function switchMode(nextMode: ViewMode) {
    if (pending || mode === nextMode) return
    startTransition(async () => {
      await setViewMode(nextMode)
      setMode(nextMode)
      router.refresh()
    })
  }

  return (
    <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 text-xs shadow-sm">
      <button
        type="button"
        onClick={() => switchMode('user')}
        className={[
          'rounded-full px-3 py-1 transition',
          mode === 'user' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-800',
          pending ? 'opacity-60' : '',
        ].join(' ')}
        disabled={pending}
      >
        User view
      </button>
      <button
        type="button"
        onClick={() => switchMode('admin')}
        className={[
          'rounded-full px-3 py-1 transition',
          mode === 'admin' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-800',
          pending ? 'opacity-60' : '',
        ].join(' ')}
        disabled={pending}
      >
        Admin view
      </button>
    </div>
  )
}
