'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { setMode } from '@/actions/mode'
import type { ViewMode } from '@/lib/permissions'

type UserMenuProps = {
  email: string | null
  tenantName: string | null
  role: string | null
  isSuperAdmin: boolean
  viewMode: ViewMode
}

export default function UserMenu({ email, tenantName, role, isSuperAdmin, viewMode }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [switchPending, startSwitchTransition] = useTransition()
  const [signingOut, startSignOut] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const rolePresentation = useMemo(() => {
    const normalized = role?.toLowerCase() ?? ''
    if (isSuperAdmin) {
      return { label: 'Superadmin', badgeClass: 'bg-purple-600/30 text-purple-100' }
    }
    const map: Record<string, { label: string; badgeClass: string }> = {
      owner: { label: 'Owner', badgeClass: 'bg-purple-500/25 text-purple-100' },
      admin: { label: 'Admin', badgeClass: 'bg-indigo-500/25 text-indigo-100' },
      teacher: { label: 'Teacher', badgeClass: 'bg-blue-500/25 text-blue-100' },
      student: { label: 'Student', badgeClass: 'bg-emerald-500/25 text-emerald-100' },
      banned: { label: 'Banned', badgeClass: 'bg-red-500/30 text-red-100' },
    }
    return map[normalized] ?? { label: 'Member', badgeClass: 'bg-slate-500/25 text-slate-100' }
  }, [isSuperAdmin, role])

  const initials = useMemo(() => {
    if (email && email.length > 0) return email[0]?.toUpperCase()
    if (tenantName && tenantName.length > 0) return tenantName[0]?.toUpperCase()
    return 'U'
  }, [email, tenantName])

  function handleToggle() {
    setOpen((prev) => !prev)
  }

  function handleSwitchMode() {
    const nextMode: ViewMode = viewMode === 'admin' ? 'user' : 'admin'
    startSwitchTransition(async () => {
      await setMode(nextMode)
      setOpen(false)
      router.refresh()
    })
  }

  function handleSignOut() {
    startSignOut(async () => {
      await supabase.auth.signOut()
      await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' }).catch(() => undefined)
      setOpen(false)
      router.replace('/auth')
      router.refresh()
    })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-100 hover:bg-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
        aria-label="Open profile menu"
      >
        {initials}
        <span
          className={[
            'absolute -right-2 -top-1 rounded-full border border-purple-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            rolePresentation.badgeClass,
          ].join(' ')}
        >
          {rolePresentation.label}
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-900">{email ?? 'Unknown user'}</p>
            {tenantName ? <p className="text-xs text-gray-500">{tenantName}</p> : null}
            <span
              className={[
                'mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
                rolePresentation.badgeClass,
              ].join(' ')}
            >
              {rolePresentation.label}
            </span>
          </div>
          <div className="space-y-1 px-2 py-2 text-sm">
            {isSuperAdmin ? (
              <button
                type="button"
                onClick={handleSwitchMode}
                disabled={switchPending}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Switch to {viewMode === 'admin' ? 'User' : 'Admin'} view
                {switchPending ? (
                  <span className="text-xs text-gray-400">…</span>
                ) : (
                  <span className="text-xs text-blue-600">Toggle</span>
                )}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Sign out
              {signingOut ? <span className="text-xs text-gray-400">…</span> : null}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
