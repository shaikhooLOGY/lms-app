'use client'

import { ReactNode } from 'react'

type DataTableProps = {
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
  empty?: ReactNode
}

export default function DataTable({ header, children, footer, empty }: DataTableProps) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <div className="overflow-hidden rounded-2xl border border-purple-700/40 bg-gradient-to-br from-[#0e0a1a] via-[#110d20] to-[#08050f] shadow-[0_24px_60px_-30px_rgba(139,92,246,0.9)]">
      {header ? <div className="border-b border-purple-800/40 px-6 py-4 text-sm text-purple-200">{header}</div> : null}
      <div className="max-h-[70vh] overflow-x-auto">
        {hasRows ? (
          <table className="min-w-full divide-y divide-purple-900/40 text-sm text-gray-200">
            {children}
          </table>
        ) : (
          <div className="px-6 py-16 text-center text-sm text-purple-200">{empty}</div>
        )}
      </div>
      {footer ? <div className="border-t border-purple-900/40 px-6 py-3 text-xs text-purple-300">{footer}</div> : null}
    </div>
  )
}
