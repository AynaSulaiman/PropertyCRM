import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromRequest } from './lib/auth'

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/api/leads', '/api/agents', '/api/analytics']
const ADMIN_ONLY_ROUTES = ['/dashboard/admin', '/api/leads/[id]/assign']
const AUTH_ROUTES = ['/login', '/signup']

// Rate limiting store (in-memory for edge runtime)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/socket')
  ) {
    return NextResponse.next()
  }

  const token = getTokenFromRequest(request)
  const user = token ? verifyToken(token) : null

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = user ? `user_${user.userId}` : `ip_${ip}`

    // Agents: 50 req/min, Admins: 500 req/min, Unknown: 20 req/min
    const maxRequests = user?.role === 'admin' ? 500 : user?.role === 'agent' ? 50 : 20
    const windowMs = 60 * 1000 // 1 minute

    const allowed = checkRateLimit(rateLimitKey, maxRequests, windowMs)

    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    if (user) {
      const redirectTo = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return NextResponse.next()
  }

  // Protect routes that require authentication
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  if (isProtected && !user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only route protection
  if (pathname.startsWith('/dashboard/admin') && user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard/agent', request.url))
  }

  // Agent-only route protection - agents can't access admin routes
  if (pathname.startsWith('/api/') && pathname.includes('/admin') && user?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
  }

  // Add user info to headers for API routes
  if (user) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.userId)
    requestHeaders.set('x-user-role', user.role)
    requestHeaders.set('x-user-email', user.email)
    requestHeaders.set('x-user-name', user.name)

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
