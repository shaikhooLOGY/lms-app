'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import DataTable from '@/components/admin/DataTable'
import Drawer from '@/components/admin/Drawer'
import EmptyState from '@/components/admin/EmptyState'
import FormModal from '@/components/admin/FormModal'
import { updateTenantStatusAction, upsertTenantAction, attachTenantCookie } from '@/lib/actions/admin/tenants'
import { tenantStatusEnum } from '@/lib/validators/tenant'

export type InstituteRow = {
  id: string
  name: string
  status: string
  created_at: string
  subdomain?: string | null
}

type InstitutesClientProps = {
  records: InstituteRow[]
}

export default function InstitutesClient({ records }: InstitutesClientProps) {
  const [selected, setSelected] = useState<InstituteRow | null>(null)
  const [editing, setEditing] = useState<InstituteRow | null>(null)
  const [statusPending, startStatusTransition] = useTransition()
  const [statusError, setStatusError] = useState<string | null>(null)

  async function changeStatus(tenantId: string, status: string) {
    startStatusTransition(async () => {
      const formData = new FormData()
      formData.append('tenantId', tenantId)
      formData.append('status', status)
      const result = await updateTenantStatusAction(formData)
      if (result.error) {
        setStatusError(result.error)
        return
      }
      setStatusError(null)
      if (status === 'active') {
        await attachTenantCookie(tenantId)
      }
    })
  }

  if (records.length === 0) {
    return (
      <EmptyState
        title="No institutes found"
        description="Try adjusting your filters or onboarding a new institute."
        action={<NewInstituteButton variant="primary" />}
      />
    )
  }

  return (
    <div className="space-y-4">
      {statusError ? <p className="text-sm text-red-400">{statusError}</p> : null}
      <DataTable
        header={
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <span>Total {records.length} institutes</span>
            <NewInstituteButton />
          </div>
        }
        empty="No institutes"
      >
        <thead className="bg-[#100822] text-xs uppercase tracking-wide text-purple-300">
          <tr>
            <th className="px-6 py-3 text-left">Name</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">Created</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-900/40 text-sm">
          {records.map((tenant) => (
            <tr key={tenant.id} className="hover:bg-purple-950/40">
              <td className="px-6 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-white">{tenant.name}</span>
                  <span className="text-xs text-purple-300">{tenant.id}</span>
                </div>
              </td>
              <td className="px-6 py-3">
                <StatusBadge status={tenant.status} />
              </td>
              <td className="px-6 py-3 text-purple-200">{new Date(tenant.created_at).toLocaleDateString()}</td>
              <td className="px-6 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(tenant)}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(tenant)}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => changeStatus(tenant.id, tenant.status === 'suspended' ? 'active' : 'suspended')}
                    disabled={statusPending}
                    className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
                  >
                    {tenant.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>
                  <button
                    type="button"
                    onClick={() => changeStatus(tenant.id, 'banned')}
                    disabled={statusPending}
                    className="rounded-full border border-red-500/50 px-3 py-1 text-xs text-red-200 hover:border-red-400 hover:text-red-100"
                  >
                    Ban
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <InstituteDrawer tenant={selected} onClose={() => setSelected(null)} onEdit={() => setEditing(selected)} />
      <TenantModal key={editing?.id ?? 'new'} tenant={editing} open={editing !== null} onClose={() => setEditing(null)} />
    </div>
  )
}

export function NewInstituteButton({ variant = 'outline' }: { variant?: 'outline' | 'primary' }) {
  const [open, setOpen] = useState(false)

  const className = useMemo(() => {
    if (variant === 'primary') {
      return 'rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500'
    }
    return 'rounded-full border border-purple-700/40 px-4 py-2 text-sm font-medium uppercase tracking-wide text-purple-200 transition hover:border-purple-400 hover:text-white'
  }, [variant])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        New institute
      </button>
      <TenantModal key={open ? 'new-open' : 'new-closed'} tenant={null} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-200',
    pending_review: 'bg-yellow-500/20 text-yellow-200',
    suspended: 'bg-orange-500/20 text-orange-200',
    rejected: 'bg-red-500/20 text-red-200',
    banned: 'bg-red-600/30 text-red-200',
    inactive: 'bg-gray-500/20 text-gray-200',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${map[status] ?? 'bg-purple-600/20 text-purple-100'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function InstituteDrawer({ tenant, onClose, onEdit }: { tenant: InstituteRow | null; onClose: () => void; onEdit: () => void }) {
  if (!tenant) return null

  return (
    <Drawer
      open={Boolean(tenant)}
      title={tenant.name}
      description={`Status: ${tenant.status.replace('_', ' ')}`}
      onClose={onClose}
    >
      <div className="space-y-6 text-sm text-purple-100">
        <section>
          <h3 className="text-xs uppercase tracking-wide text-purple-300">Overview</h3>
          <dl className="mt-2 space-y-2">
            <div className="flex justify-between">
              <dt className="text-purple-300">Tenant ID</dt>
              <dd className="text-white">{tenant.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-purple-300">Created</dt>
              <dd>{new Date(tenant.created_at).toLocaleString()}</dd>
            </div>
          </dl>
        </section>
        <section className="space-y-2">
          <h3 className="text-xs uppercase tracking-wide text-purple-300">Quick actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/classrooms?tenant=${tenant.id}`}
              className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
            >
              View classrooms
            </Link>
            <Link
              href={`/admin/educators?tenant=${tenant.id}`}
              className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
            >
              Educators
            </Link>
            <Link
              href={`/admin/students?tenant=${tenant.id}`}
              className="rounded-full border border-purple-700/40 px-3 py-1 text-xs text-purple-200 hover:border-purple-400 hover:text-white"
            >
              Students
            </Link>
          </div>
        </section>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-purple-700/40 px-4 py-2 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-400 hover:text-white"
        >
          Edit institute
        </button>
      </div>
    </Drawer>
  )
}

function TenantModal({ tenant, open, onClose }: { tenant: InstituteRow | null; open: boolean; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(tenant?.name ?? '')
  const [subdomain, setSubdomain] = useState(tenant?.subdomain ?? '')
  const [status, setStatus] = useState(tenant?.status ?? 'pending_review')

  useEffect(() => {
    setName(tenant?.name ?? '')
    setSubdomain(tenant?.subdomain ?? '')
    setStatus(tenant?.status ?? 'pending_review')
  }, [tenant])

  if (!open) return null

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertTenantAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      onClose()
    })
  }

  return (
    <FormModal open={open} onClose={onClose} title={tenant ? 'Edit institute' : 'New institute'}>
      <form action={handleSubmit} className="space-y-4">
        {tenant ? <input type="hidden" name="id" value={tenant.id} /> : null}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-purple-300">Name</label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-purple-300">Subdomain</label>
          <input
            name="subdomain"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
            placeholder="academy"
            className="w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
          />
          <p className="text-xs text-purple-400">URL: {subdomain || '<subdomain>'}.learn.shaikhoology.com</p>
        </div>
        {tenant ? (
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-purple-300">Status</label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
            >
              {tenantStatusEnum.options.map((option: string) => (
                <option key={option} value={option} className="bg-[#0d0818]">
                  {option.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
        >
          {pending ? 'Saving…' : tenant ? 'Update institute' : 'Create institute'}
        </button>
      </form>
    </FormModal>
  )
}
