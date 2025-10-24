import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AdminClassroomCreatePage() {
  redirect('/admin/classrooms')
}
