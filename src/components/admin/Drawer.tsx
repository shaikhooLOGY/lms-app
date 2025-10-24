'use client'

import { ReactNode, useEffect } from 'react'

type DrawerProps = {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

export default function Drawer({ open, title, description, onClose, children }: DrawerProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/70 backdrop-blur" onClick={onClose} />
      <aside className="relative ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-purple-800/50 bg-[#0a0612] text-gray-100 shadow-[0_0_60px_rgba(124,58,237,0.6)]">
        <header className="border-b border-purple-900/60 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              {description ? <p className="text-sm text-purple-200/80">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-purple-700/50 px-3 py-1 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-500 hover:text-white"
            >
              Close
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </aside>
    </div>
  )
}
