'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/session'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [sub, setSub]   = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg]   = useState<string>('')

  async function checkSubdomain() {
    setMsg(''); setBusy(true)
    const { count, error } = await supabase
      .from('tenant_domains')
      .select('id', { count: 'exact', head: true })
      .eq('subdomain', sub)
    setBusy(false)
    if (error) return setMsg(error.message)
    if ((count ?? 0) > 0) setMsg('❌ Not available')
    else setMsg('✅ Available')
  }

  async function createTenant(e: React.FormEvent) {
    e.preventDefault()
    setMsg(''); setBusy(true)

    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('Please sign in first.')

      // 1) create tenant (you are the owner)
      const { data: t, error: tErr } = await supabase
        .from('tenants')
        .insert([{ name, owner_user_id: user.id }])
        .select('id')
        .single()
      if (tErr) throw tErr

      // 2) attach subdomain
      const { error: dErr } = await supabase
        .from('tenant_domains')
        .insert([{ tenant_id: t.id, subdomain: sub, is_primary: true }])
      if (dErr) throw dErr

      // 3) self-membership as teacher (optional now; policy not strict yet)
      await supabase
        .from('tenant_members')
        .insert([{ tenant_id: t.id, user_id: user.id, role: 'teacher' }])
        .single()

      setMsg(`🎉 Tenant created. Your URL will be: https://${sub}.learn.shaikhoology.com`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMsg(err?.message ?? 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={{maxWidth:520, margin:'40px auto', padding:24, border:'1px solid #eee', borderRadius:12}}>
      <h1 style={{marginBottom:12}}>Create your Institute</h1>

      <form onSubmit={createTenant}>
        <label>Name</label>
        <input
          value={name} onChange={e=>setName(e.target.value)}
          placeholder="Ali Academy"
          style={{width:'100%', padding:10, marginBottom:12}}
          required
        />

        <label>Subdomain</label>
        <div style={{display:'flex', gap:8}}>
          <input
            value={sub} onChange={e=>setSub(e.target.value.toLowerCase())}
            placeholder="ali"
            pattern="^[a-z0-9-]{2,40}$"
            title="lowercase letters, numbers, hyphen"
            style={{flex:1, padding:10}}
            required
          />
          <button type="button" onClick={checkSubdomain} disabled={!sub || busy}>Check</button>
        </div>
        <div style={{marginTop:6, color:'#666'}}>Will be: <code>{sub || '___'}.learn.shaikhoology.com</code></div>

        <button
          type="submit" disabled={!name || !sub || busy}
          style={{marginTop:16, padding:'8px 12px', border:'1px solid #ddd', borderRadius:8}}
        >
          {busy ? 'Creating…' : 'Create'}
        </button>
      </form>

      <div style={{marginTop:12}}>{msg}</div>
    </main>
  )
}