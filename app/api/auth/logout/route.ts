import { clearAuthCookie } from '@/lib/auth'
import { successResponse } from '@/lib/apiResponse'

export async function POST() {
  const response = successResponse(null, 'Logged out successfully')
  response.headers.set('Set-Cookie', clearAuthCookie())
  return response
}
