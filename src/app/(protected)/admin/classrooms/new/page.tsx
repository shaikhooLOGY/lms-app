import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/requireSession'

export const dynamic = 'force-dynamic'

export default async function AdminClassroomCreatePage() {
  await requireSession('/admin/classrooms/new')
  redirect('/admin/classrooms')
}
