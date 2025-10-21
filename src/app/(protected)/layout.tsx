// NO "use client"
import TenantHeader from '@/components/TenantHeader'
import AuthGuard from '@/components/AuthGuard'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TenantHeader />
      <AuthGuard>{children}</AuthGuard>
    </>
  )
}
