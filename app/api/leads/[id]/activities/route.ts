import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Activity from '@/models/Activity'
import Lead from '@/models/Lead'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/apiResponse'
import mongoose from 'mongoose'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()

    if (!mongoose.Types.ObjectId.isValid(params.id)) return notFoundResponse('Invalid lead ID')

    await connectDB()

    const lead = await Lead.findById(params.id)
    if (!lead) return notFoundResponse('Lead not found')

    // Agents can only view activities for their assigned leads
    if (user.role === 'agent') {
      if (lead.assignedTo?.toString() !== user.userId) return forbiddenResponse()
    }

    const activities = await Activity.find({ leadId: params.id })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean()

    return successResponse(activities)
  } catch (error) {
    console.error('[API/leads/:id/activities GET]', error)
    return errorResponse('Failed to fetch activities', 500)
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()

    if (!mongoose.Types.ObjectId.isValid(params.id)) return notFoundResponse('Invalid lead ID')

    await connectDB()

    const lead = await Lead.findById(params.id)
    if (!lead) return notFoundResponse('Lead not found')

    if (user.role === 'agent' && lead.assignedTo?.toString() !== user.userId) {
      return forbiddenResponse()
    }

    const { action, details, metadata } = await request.json()
    if (!action || !details) return errorResponse('Action and details are required', 400)

    const activity = await Activity.create({
      leadId: params.id,
      action,
      performedBy: user.userId,
      details,
      metadata: metadata || {},
    })

    await Lead.findByIdAndUpdate(params.id, { lastActivityAt: new Date() })

    const populated = await Activity.findById(activity._id).populate('performedBy', 'name email role').lean()
    return successResponse(populated, 'Activity logged', 201)
  } catch (error) {
    console.error('[API/leads/:id/activities POST]', error)
    return errorResponse('Failed to log activity', 500)
  }
}
