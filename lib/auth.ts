import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: 'admin' | 'agent'
  name: string
  iat?: number
  exp?: number
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookie
  const cookieToken = request.cookies.get('crm_token')?.value
  if (cookieToken) {
    return cookieToken
  }

  return null
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('crm_token')?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

export function setAuthCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const maxAge = 7 * 24 * 60 * 60 // 7 days in seconds
  return `crm_token=${token}; Path=/; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Max-Age=${maxAge}`
}

export function clearAuthCookie(): string {
  return `crm_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
}
