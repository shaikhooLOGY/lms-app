'use client'

import { ReactNode } from 'react'

type FormModalProps = {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

export default function FormModal({ open, title, description, onClose, children }: FormModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-purple-800/60 bg-[#0d0818] p-6 text-gray-100 shadow-[0_0_60px_rgba(109,40,217,0.6)]">
        <header className="mb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-purple-200/80">{description}</p> : null}
        </header>
        <div className="space-y-4">{children}</div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-purple-700/50 px-4 py-1.5 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-500 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
