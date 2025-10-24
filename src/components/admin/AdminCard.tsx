'use client'

import { ReactNode } from 'react'

type AdminCardProps = {
  title: string
  value?: ReactNode
  description?: string
  icon?: ReactNode
  children?: ReactNode
}

export default function AdminCard({ title, value, description, icon, children }: AdminCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-purple-700/40 bg-gray-950/90 p-5 text-gray-100 shadow-[0_10px_40px_-20px_rgba(124,58,237,0.8)]">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon ? <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/30 text-purple-300">{icon}</span> : null}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-200/90">{title}</h3>
            {description ? <p className="text-xs text-gray-400">{description}</p> : null}
          </div>
        </div>
        {value ? <div className="text-2xl font-semibold text-purple-100">{value}</div> : null}
      </header>
      {children ? <div className="text-sm text-gray-300">{children}</div> : null}
    </section>
  )
}
