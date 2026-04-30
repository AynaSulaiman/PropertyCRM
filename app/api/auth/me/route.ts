import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { successResponse, unauthorizedResponse } from '@/lib/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()

    const payload = verifyToken(token)
    if (!payload) return unauthorizedResponse('Invalid or expired token')

    await connectDB()
    const user = await User.findById(payload.userId)
    if (!user || !user.isActive) return unauthorizedResponse()

    return successResponse({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    })
  } catch (error) {
    console.error('[API/me]', error)
    return unauthorizedResponse()
  }
}
