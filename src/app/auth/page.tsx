'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [msg, setMsg] = useState<string>('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: email.split('@')[0] } }
        })
        if (error) throw error
        setMsg('Signup done. Check email if confirmation is required.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMsg('Signed in ✅')
      }
    } catch (err: unknown) {
  const e = err as { message?: string }
  setMsg(e.message ?? 'Auth error')
}
  }

  async function signOut() {
    await supabase.auth.signOut()
    setMsg('Signed out.')
  }

  return (
    <main style={{maxWidth:420, margin:'40px auto', padding:24, border:'1px solid #eee', borderRadius:12}}>
      <h1 style={{marginBottom:12}}>Auth</h1>
      <div style={{marginBottom:12}}>
        <button onClick={()=>setMode('signin')} disabled={mode==='signin'}>Sign In</button>
        <button onClick={()=>setMode('signup')} disabled={mode==='signup'} style={{marginLeft:8}}>Sign Up</button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="email" placeholder="email" value={email}
          onChange={e=>setEmail(e.target.value)}
          style={{width:'100%', padding:10, marginBottom:8}}
          required
        />
        <input
          type="password" placeholder="password" value={password}
          onChange={e=>setPassword(e.target.value)}
          style={{width:'100%', padding:10, marginBottom:8}}
          required
        />
        <button type="submit" style={{padding:'8px 12px', border:'1px solid #ddd', borderRadius:8}}>
          {mode==='signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <div style={{marginTop:12}}>{msg}</div>

      <div style={{marginTop:16}}>
        <button onClick={signOut} style={{padding:'6px 10px'}}>Sign out</button>
      </div>
    </main>
  )
}