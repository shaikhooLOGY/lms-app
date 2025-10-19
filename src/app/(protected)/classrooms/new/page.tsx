'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function NewClassroom() {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [tenantId, setTenantId] = useState('') // for now, paste your tenant id to test quickly
  const [msg, setMsg] = useState('')

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const { error } = await supabase
      .from('classrooms')
      .insert([{ tenant_id: tenantId, title, description: desc }])
    setMsg(error ? `❌ ${error.message}` : '✅ Created')
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">New Classroom</h1>
      <form onSubmit={create}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title"
          className="border p-2 w-full mb-2" required />
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description"
          className="border p-2 w-full mb-2" rows={4} />
        <input value={tenantId} onChange={e=>setTenantId(e.target.value)} placeholder="Tenant ID (temp)"
          className="border p-2 w-full mb-2" required />
        <button className="border px-3 py-2 rounded">Create</button>
      </form>
      <div className="mt-3 text-sm">{msg}</div>
    </main>
  )
}