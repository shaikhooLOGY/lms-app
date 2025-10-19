'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)
    })()
  }, [])

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Dashboard</h1>
      <p className="text-sm text-gray-600">Signed in as: {email}</p>
    </main>
  )
}