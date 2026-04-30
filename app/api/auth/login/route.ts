import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { signToken, setAuthCookie } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return errorResponse('Email and password are required', 400)
    }

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) {
      return errorResponse('Invalid email or password', 401)
    }

    if (!user.isActive) {
      return errorResponse('Account has been deactivated. Contact admin.', 403)
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401)
    }

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
      'Login successful'
    )

    response.headers.set('Set-Cookie', setAuthCookie(token))
    return response
  } catch (error: unknown) {
    console.error('[API/login]', error)
    return errorResponse('Login failed. Please try again.', 500)
  }
}
