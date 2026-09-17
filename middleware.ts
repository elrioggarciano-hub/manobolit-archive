import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authed = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  // Admin pages: everything under /admin except the login page itself requires a session.
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!authed) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // API routes: reads stay public, writes require a session.
  const isEntriesWrite = pathname.startsWith('/api/entries') && MUTATING_METHODS.has(request.method)
  const isClassifyWrite = pathname.startsWith('/api/classify') && MUTATING_METHODS.has(request.method)
  if ((isEntriesWrite || isClassifyWrite) && !authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/entries/:path*', '/api/classify/:path*'],
}
