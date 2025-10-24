'use client'

import { ReactNode } from 'react'

type TopBarProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-purple-800/50 bg-[#120923]/95 px-6 py-5 text-gray-100 shadow-[0_12px_40px_-18px_rgba(109,40,217,0.65)] md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-white md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-purple-200/90">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  )
}
