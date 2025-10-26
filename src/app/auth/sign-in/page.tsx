import SignInForm from '@/components/auth/SignInForm'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const nextParam = searchParams.next
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam ?? undefined

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-16 text-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-purple-500/40 bg-[#0d061a]/90 p-8 shadow-[0_30px_80px_-40px_rgba(139,92,246,0.7)] backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-white">Sign in to Shaikhoology LMS</h1>
          <p className="text-sm text-purple-200/80">
            Use your email to receive a one-time code. We’ll automatically take you back to your destination.
          </p>
        </div>
        <SignInForm next={next} />
        <p className="text-center text-xs text-purple-300/70">
          Trouble signing in? Contact support@shaikhoology.com
        </p>
      </div>
    </main>
  )
}
