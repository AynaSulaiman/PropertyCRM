import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { signToken, setAuthCookie } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, phone } = body

    // Validation
    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required', 400)
    }
    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400)
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return errorResponse('Invalid email format', 400)
    }

    await connectDB()

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return errorResponse('An account with this email already exists', 409)
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'agent',
      phone: phone?.trim(),
    })

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    })

    const response = successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
        token,
      },
      'Account created successfully',
      201
    )

    response.headers.set('Set-Cookie', setAuthCookie(token))
    return response
  } catch (error: unknown) {
    console.error('[API/signup]', error)
    const msg = error instanceof Error ? error.message : 'Registration failed'
    return errorResponse(msg, 500)
  }
}
