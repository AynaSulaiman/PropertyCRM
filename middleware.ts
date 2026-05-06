import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'property_crm_super_secret_key_2024_xyz_abc_123'

interface JWTPayload {
  userId: string
  email: string
  role: 'admin' | 'agent'
  name: string
}

// Edge-compatible JWT verification using jose
async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7)
  return request.cookies.get('crm_token')?.value || null
}

// Rate limiting store (in-memory for edge)
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = getToken(request)
  const user = token ? await verifyTokenEdge(token) : null

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = user ? `user_${user.userId}` : `ip_${ip}`
    const maxRequests = user?.role === 'admin' ? 500 : user?.role === 'agent' ? 50 : 20

    if (!checkRateLimit(rateLimitKey, maxRequests, 60_000)) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname === '/login' || pathname === '/signup') {
    if (user) {
      return NextResponse.redirect(
        new URL(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent', request.url)
      )
    }
    return NextResponse.next()
  }

  // Protect dashboard and API routes
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/leads') ||
    pathname.startsWith('/api/agents') ||
    pathname.startsWith('/api/analytics')

  if (isProtected && !user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Block agents from admin routes
  if (pathname.startsWith('/dashboard/admin') && user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard/agent', request.url))
  }

  // Forward user info to API routes via headers
  if (user) {
    const headers = new Headers(request.headers)
    headers.set('x-user-id', user.userId)
    headers.set('x-user-role', user.role)
    headers.set('x-user-email', user.email)
    headers.set('x-user-name', user.name)
    return NextResponse.next({ request: { headers } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
