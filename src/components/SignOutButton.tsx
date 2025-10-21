'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignOutButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function handleSignOut() {
    await supabase.auth.signOut()
    startTransition(() => {
      router.replace('/auth')
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-full border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 disabled:opacity-60"
      disabled={pending}
      type="button"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
