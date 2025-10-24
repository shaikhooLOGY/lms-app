'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'
import { resolveAdminTenantContext } from '@/lib/actions/classrooms'
import { brandingSchema, enrollmentRulesSchema, notificationsSchema, rolesSchema } from '@/lib/validators/settings'
import { logActivity } from './activity'

export type SettingsSnapshot = {
  name: string | null
  logo_url: string | null
  primary_color: string | null
  auto_approve_enrollments: boolean
  require_reason: boolean
  email_digest_enabled: boolean
  slack_webhook: string | null
  default_role: string | null
  allow_self_upgrade: boolean
}

export async function fetchSettings(): Promise<SettingsSnapshot | null> {
  const client = createServiceClient()
  const { tenantId } = await resolveAdminTenantContext(client)
  if (!tenantId) return null

  const { data, error } = await client
    .from('tenant_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as SettingsSnapshot | null
}

export async function saveBrandingAction(formData: FormData) {
  const parsed = brandingSchema.safeParse({
    tenantId: formData.get('tenantId')?.toString(),
    name: formData.get('name')?.toString(),
    logoUrl: formData.get('logoUrl')?.toString(),
    primaryColor: formData.get('primaryColor')?.toString(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid branding payload' }
  }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId } = await resolveAdminTenantContext(client, user.id)
    if (!tenantId || tenantId !== parsed.data.tenantId) return { error: 'Tenant mismatch.' }

    await client
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        display_name: parsed.data.name,
        logo_url: parsed.data.logoUrl ?? null,
        primary_color: parsed.data.primaryColor ?? null,
      })

    await logActivity({
      entityType: 'settings',
      entityId: tenantId,
      action: 'branding_updated',
      meta: parsed.data,
    })

    revalidatePath('/admin/settings')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save branding'
    return { error: message }
  }
}

export async function saveEnrollmentRulesAction(formData: FormData) {
  const parsed = enrollmentRulesSchema.safeParse({
    tenantId: formData.get('tenantId')?.toString(),
    autoApprove: formData.get('autoApprove')?.toString(),
    requireReason: formData.get('requireReason')?.toString(),
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid enrollment payload' }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId } = await resolveAdminTenantContext(client, user.id)
    if (!tenantId || tenantId !== parsed.data.tenantId) return { error: 'Tenant mismatch.' }

    await client
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        auto_approve_enrollments: Boolean(parsed.data.autoApprove),
        require_reason: Boolean(parsed.data.requireReason),
      })

    await logActivity({
      entityType: 'settings',
      entityId: tenantId,
      action: 'enrollment_rules_updated',
      meta: parsed.data,
    })

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save enrollment rules'
    return { error: message }
  }
}

export async function saveNotificationsAction(formData: FormData) {
  const parsed = notificationsSchema.safeParse({
    tenantId: formData.get('tenantId')?.toString(),
    emailDigest: formData.get('emailDigest')?.toString(),
    slackHook: formData.get('slackHook')?.toString(),
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid notification payload' }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId } = await resolveAdminTenantContext(client, user.id)
    if (!tenantId || tenantId !== parsed.data.tenantId) return { error: 'Tenant mismatch.' }

    await client
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        email_digest_enabled: Boolean(parsed.data.emailDigest),
        slack_webhook: parsed.data.slackHook ?? null,
      })

    await logActivity({
      entityType: 'settings',
      entityId: tenantId,
      action: 'notifications_updated',
      meta: parsed.data,
    })

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save notifications'
    return { error: message }
  }
}

export async function saveRolesAction(formData: FormData) {
  const parsed = rolesSchema.safeParse({
    tenantId: formData.get('tenantId')?.toString(),
    defaultRole: formData.get('defaultRole')?.toString(),
    allowSelfUpgrade: formData.get('allowSelfUpgrade')?.toString(),
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid role payload' }

  try {
    const client = createServiceClient()
    const user = await getAuthenticatedUser(client)
    const { tenantId } = await resolveAdminTenantContext(client, user.id)
    if (!tenantId || tenantId !== parsed.data.tenantId) return { error: 'Tenant mismatch.' }

    await client
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        default_role: parsed.data.defaultRole,
        allow_self_upgrade: Boolean(parsed.data.allowSelfUpgrade),
      })

    await logActivity({
      entityType: 'settings',
      entityId: tenantId,
      action: 'roles_updated',
      meta: parsed.data,
    })

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save roles'
    return { error: message }
  }
}
