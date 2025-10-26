import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const secure = process.env.NODE_ENV === 'production'
const ACCESS_TOKEN_COOKIE = 'sb-access-token'
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const accessToken = typeof body.access_token === 'string' ? body.access_token : null
  const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : null
  const expiresIn = typeof body.expires_in === 'number' ? body.expires_in : undefined

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: expiresIn ?? 60 * 60,
  })
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
  })
  cookieStore.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
  })

  return NextResponse.json({ success: true })
}
