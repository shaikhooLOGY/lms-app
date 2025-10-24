import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { getViewMode, isAdminLike, getIsSuperAdmin } from '@/lib/permissions'
import { requireSession } from '@/lib/auth/requireSession'

type AdminOnlyProps = {
  tenantId?: string | null
  children: ReactNode
}

export async function AdminOnly({ tenantId, children }: AdminOnlyProps) {
  await requireSession()

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
