'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const authed = !!data.session
      if (!authed) router.replace(`/auth?next=${encodeURIComponent(pathname)}`)
      if (active) setReady(true)
    })()
    return () => { active = false }
  }, [router, pathname])

  if (!ready) return null
  return <>{children}</>
}