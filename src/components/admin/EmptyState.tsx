'use client'

import { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-purple-700/40 bg-[#0b0715] p-10 text-center text-purple-100">
      {icon ? <div className="text-4xl text-purple-400">{icon}</div> : null}
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description ? <p className="mt-2 text-sm text-purple-200/80">{description}</p> : null}
      </div>
      {action ?? null}
    </div>
  )
}
