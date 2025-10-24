'use client'

import { useState, useTransition } from 'react'
import AdminCard from '@/components/admin/AdminCard'
import FormModal from '@/components/admin/FormModal'
import { saveBrandingAction, saveEnrollmentRulesAction, saveNotificationsAction, saveRolesAction, type SettingsSnapshot } from '@/lib/actions/admin/settings'

type SettingsClientProps = {
  tenantId: string
  settings: SettingsSnapshot | null
}

export default function SettingsClient({ tenantId, settings }: SettingsClientProps) {
  const [openModal, setOpenModal] = useState<'branding' | 'enrollment' | 'notifications' | 'roles' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(action: (formData: FormData) => Promise<{ success?: boolean; error?: string }>, formData: FormData) {
    startTransition(async () => {
      const result = await action(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setOpenModal(null)
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {error ? <p className="md:col-span-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      <AdminCard
        title="Branding"
        description="Logo, name, and theme accent."
        value={settings?.name ?? 'Not set'}
        icon={<span>🎨</span>}
      >
        <button
          type="button"
          onClick={() => setOpenModal('branding')}
          className="rounded-full border border-purple-700/40 px-3 py-1 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-400 hover:text-white"
        >
          Edit branding
        </button>
      </AdminCard>

      <AdminCard
        title="Enrollment Rules"
        description="Auto-approval and intake policies."
        value={settings?.auto_approve_enrollments ? 'Auto-approve' : 'Manual review'}
        icon={<span>✅</span>}
      >
        <button
          type="button"
          onClick={() => setOpenModal('enrollment')}
          className="rounded-full border border-purple-700/40 px-3 py-1 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-400 hover:text-white"
        >
          Configure rules
        </button>
      </AdminCard>

      <AdminCard
        title="Notifications"
        description="Digests and Slack hooks."
        value={settings?.email_digest_enabled ? 'Emails on' : 'Emails off'}
        icon={<span>🔔</span>}
      >
        <button
          type="button"
          onClick={() => setOpenModal('notifications')}
          className="rounded-full border border-purple-700/40 px-3 py-1 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-400 hover:text-white"
        >
          Manage notifications
        </button>
      </AdminCard>

      <AdminCard
        title="Roles"
        description="Default enrollments and self-upgrade."
        value={settings?.default_role ?? 'student'}
        icon={<span>🧩</span>}
      >
        <button
          type="button"
          onClick={() => setOpenModal('roles')}
          className="rounded-full border border-purple-700/40 px-3 py-1 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-400 hover:text-white"
        >
          Edit roles
        </button>
      </AdminCard>

      <BrandingModal
        tenantId={tenantId}
        settings={settings}
        open={openModal === 'branding'}
        pending={pending}
        onClose={() => setOpenModal(null)}
        onSubmit={(formData) => handleSubmit(saveBrandingAction, formData)}
      />
      <EnrollmentModal
        tenantId={tenantId}
        settings={settings}
        open={openModal === 'enrollment'}
        pending={pending}
        onClose={() => setOpenModal(null)}
        onSubmit={(formData) => handleSubmit(saveEnrollmentRulesAction, formData)}
      />
      <NotificationsModal
        tenantId={tenantId}
        settings={settings}
        open={openModal === 'notifications'}
        pending={pending}
        onClose={() => setOpenModal(null)}
        onSubmit={(formData) => handleSubmit(saveNotificationsAction, formData)}
      />
      <RolesModal
        tenantId={tenantId}
        settings={settings}
        open={openModal === 'roles'}
        pending={pending}
        onClose={() => setOpenModal(null)}
        onSubmit={(formData) => handleSubmit(saveRolesAction, formData)}
      />
    </div>
  )
}

type ModalProps = {
  tenantId: string
  settings: SettingsSnapshot | null
  open: boolean
  pending: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => void
}

function BrandingModal({ tenantId, settings, open, onClose, onSubmit, pending }: ModalProps) {
  if (!open) return null

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Branding"
      description="Update institute name, logo, and accent color."
    >
      <form action={onSubmit} className="space-y-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <label className="text-xs uppercase tracking-wide text-purple-300">
          Institute name
          <input
            name="name"
            defaultValue={settings?.name ?? ''}
            required
            className="mt-1 w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-purple-300">
          Logo URL
          <input
            name="logoUrl"
            defaultValue={settings?.logo_url ?? ''}
            className="mt-1 w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
            placeholder="https://..."
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-purple-300">
          Primary color
          <input
            name="primaryColor"
            defaultValue={settings?.primary_color ?? '#6d28d9'}
            className="mt-1 w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
            placeholder="#6d28d9"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save branding'}
        </button>
      </form>
    </FormModal>
  )
}

function EnrollmentModal({ tenantId, settings, open, onClose, onSubmit, pending }: ModalProps) {
  if (!open) return null
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Enrollment rules"
      description="Control how learners join classrooms."
    >
      <form action={onSubmit} className="space-y-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-purple-300">
          <input
            type="checkbox"
            name="autoApprove"
            defaultChecked={settings?.auto_approve_enrollments ?? false}
            className="h-4 w-4 rounded border-purple-700/60 bg-transparent text-purple-500 focus:ring-purple-400"
          />
          Auto-approve enrollment requests
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-purple-300">
          <input
            type="checkbox"
            name="requireReason"
            defaultChecked={settings?.require_reason ?? false}
            className="h-4 w-4 rounded border-purple-700/60 bg-transparent text-purple-500 focus:ring-purple-400"
          />
          Require reason for manual review
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save rules'}
        </button>
      </form>
    </FormModal>
  )
}

function NotificationsModal({ tenantId, settings, open, onClose, onSubmit, pending }: ModalProps) {
  if (!open) return null
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Notifications"
      description="Keep admins informed with digests and Slack updates."
    >
      <form action={onSubmit} className="space-y-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-purple-300">
          <input
            type="checkbox"
            name="emailDigest"
            defaultChecked={settings?.email_digest_enabled ?? false}
            className="h-4 w-4 rounded border-purple-700/60 bg-transparent text-purple-500 focus:ring-purple-400"
          />
          Send weekly email digest
        </label>
        <label className="text-xs uppercase tracking-wide text-purple-300">
          Slack webhook URL
          <input
            name="slackHook"
            defaultValue={settings?.slack_webhook ?? ''}
            className="mt-1 w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
            placeholder="https://hooks.slack.com/..."
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save notifications'}
        </button>
      </form>
    </FormModal>
  )
}

function RolesModal({ tenantId, settings, open, onClose, onSubmit, pending }: ModalProps) {
  if (!open) return null
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Roles"
      description="Define default learner role and upgrades."
    >
      <form action={onSubmit} className="space-y-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <label className="text-xs uppercase tracking-wide text-purple-300">
          Default role for new members
          <select
            name="defaultRole"
            defaultValue={settings?.default_role ?? 'student'}
            className="mt-1 w-full rounded-md border border-purple-700/40 bg-transparent px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
          >
            <option value="student" className="bg-[#0d0818]">Student</option>
            <option value="teacher" className="bg-[#0d0818]">Teacher</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-purple-300">
          <input
            type="checkbox"
            name="allowSelfUpgrade"
            defaultChecked={settings?.allow_self_upgrade ?? false}
            className="h-4 w-4 rounded border-purple-700/60 bg-transparent text-purple-500 focus:ring-purple-400"
          />
          Allow learners to request upgrade
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save roles'}
        </button>
      </form>
    </FormModal>
  )
}
