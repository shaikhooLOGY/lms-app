'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

function createBrowserClient() {
  if (supabase) return supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials are missing')
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

const googleEnabled = process.env.NEXT_PUBLIC_SUPABASE_ENABLE_GOOGLE === 'true'

export default function SignInForm({ next }: { next?: string }) {
  const router = useRouter()
  const client = createBrowserClient()

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<'email' | 'google' | null>(null)

  const syncingRef = useRef(false)
  const lastSyncedToken = useRef<string | null>(null)

  const targetPath = next && next.startsWith('/') ? next : '/dashboard'

  const syncSession = useCallback(async (session: Session | null) => {
    if (!session?.access_token || !session.refresh_token) return
    if (syncingRef.current) return
    if (lastSyncedToken.current === session.access_token) return

    syncingRef.current = true
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in ?? undefined,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Unable to store session')
      }
      lastSyncedToken.current = session.access_token
      router.replace(targetPath)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      syncingRef.current = false
    }
  }, [router, targetPath])

  useEffect(() => {
    let ignore = false

    async function prime() {
      const { data } = await client.auth.getSession()
      if (!ignore) {
        await syncSession(data.session)
      }
    }

    prime()

    const { data } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' })
        return
      }
      if (session) {
        await syncSession(session)
      }
    })

    return () => {
      ignore = true
      data.subscription.unsubscribe()
    }
  }, [client, targetPath, syncSession])

  async function handleEmailSignIn(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setSubmitting('email')

    try {
      const redirectTo = `${window.location.origin}${targetPath}`
      const { error: signInError } = await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      })
      if (signInError) throw signInError
      setMessage('Check your inbox for a magic link to finish signing in.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start email sign-in'
      setError(message)
    } finally {
      setSubmitting(null)
    }
  }

  async function handleGoogleSignIn() {
    setMessage(null)
    setError(null)
    setSubmitting('google')
    try {
      const redirectTo = `${window.location.origin}${targetPath}`
      const { error: signInError } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (signInError) throw signInError
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(message)
      setSubmitting(null)
    }
  }

  const disabled = submitting !== null

  return (
    <div className="space-y-4">
      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <label className="text-xs uppercase tracking-wide text-purple-300">
          Email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white placeholder:text-purple-300 focus:border-purple-400 focus:outline-none"
            placeholder="you@example.com"
            disabled={disabled}
          />
        </label>
        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
        >
          {submitting === 'email' ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      {googleEnabled ? (
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={disabled}
          className="w-full rounded-full border border-purple-700/40 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:border-purple-400 hover:text-white disabled:opacity-50"
        >
          {submitting === 'google' ? 'Redirecting…' : 'Continue with Google'}
        </button>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  )
}
