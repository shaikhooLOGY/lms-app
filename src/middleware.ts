import { NextResponse, NextRequest } from 'next/server'
import { findTenantByHost } from './lib/tenant'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const host = req.headers.get('host') || ''

  // ignore static/data requests
  if (url.pathname.startsWith('/_next') || url.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const tenant = await findTenantByHost(host)

  const res = NextResponse.next()
  if (tenant?.tenant_id) {
    res.cookies.set('tenant_id', tenant.tenant_id, { path: '/', httpOnly: false })
  } else {
    res.cookies.delete('tenant_id')
  }
  return res
}

// match all routes
export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}