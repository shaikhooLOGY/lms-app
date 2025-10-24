'use server'

import { createServiceClient, getAuthenticatedUser } from '@/lib/actions/supabaseServer'

type ActivityPayload = {
  entityType: string
  entityId: string
  action: string
  meta?: Record<string, unknown>
}

export async function logActivity({ entityType, entityId, action, meta }: ActivityPayload) {
  const client = createServiceClient()
  let actorId: string | null = null
  try {
    const user = await getAuthenticatedUser(client)
    actorId = user.id
  } catch {
    actorId = null
  }

  await client.from('activity_logs').insert({
    actor_id: actorId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    meta: meta ?? {},
  })
}
