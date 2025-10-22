import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { getViewMode, isAdminLike, getIsSuperAdmin } from '@/lib/permissions'
import { getOptionalUser } from '@/lib/actions/supabaseServer'

type AdminOnlyProps = {
  tenantId?: string | null
  children: ReactNode
}

export async function AdminOnly({ tenantId, children }: AdminOnlyProps) {
  const user = await getOptionalUser()
  if (!user) {
    return <p className="p-6 text-sm text-gray-600">Please sign in to continue.</p>
  }

  const superAdmin = await getIsSuperAdmin()
  if (superAdmin) {
    return <>{children}</>
  }

  const mode = await getViewMode()
  if (mode !== 'admin') {
    return <>Access restricted</>
  }

  const cookieStore = await cookies()
  const tenantCookie = tenantId ?? cookieStore.get('tenant_id')?.value ?? null

  if (!tenantCookie) {
    return <>Access restricted</>
  }

  const allowed = await isAdminLike(tenantCookie)
  if (!allowed) {
    return <>Access restricted</>
  }

  return <>{children}</>
}
