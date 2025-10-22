'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { isSuperAdmin, type ViewMode } from '@/lib/permissions'

export async function setMode(mode: ViewMode): Promise<void> {
  const allowed = await isSuperAdmin()
  if (!allowed) throw new Error('Only superadmins can change view mode.')

  const cookieStore = await cookies()
  cookieStore.set('view_mode', mode, {
    path: '/',
    httpOnly: false,
  })

  revalidatePath('/', 'layout')
}

export async function setViewMode(mode: ViewMode): Promise<void> {
  await setMode(mode)
}
