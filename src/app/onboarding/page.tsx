'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { createTenantAction } from '@/lib/actions/tenants'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [sub, setSub]   = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg]   = useState<string>('')
  const [creating, startTransition] = useTransition()
  const router = useRouter()

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

  function createTenant(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    startTransition(async () => {
      try {
        await createTenantAction({ name, subdomain: sub })
        router.replace('/admin/dashboard')
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Something went wrong'
        setMsg(message)
      }
    })
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
          <button type="button" onClick={checkSubdomain} disabled={!sub || busy || creating}>Check</button>
        </div>
        <div style={{marginTop:6, color:'#666'}}>Will be: <code>{sub || '___'}.learn.shaikhoology.com</code></div>

        <button
          type="submit" disabled={!name || !sub || busy || creating}
          style={{marginTop:16, padding:'8px 12px', border:'1px solid #ddd', borderRadius:8}}
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>

      <div style={{marginTop:12}}>{msg}</div>
    </main>
  )
}
