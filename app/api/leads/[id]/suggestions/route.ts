import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Lead from '@/models/Lead'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/apiResponse'
import { generateAISuggestions, getFollowUpScore } from '@/lib/aiSuggestions'
import mongoose from 'mongoose'
import type { Lead as LeadType } from '@/types'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()

    if (!mongoose.Types.ObjectId.isValid(params.id)) return notFoundResponse()

    await connectDB()
    const lead = await Lead.findById(params.id).populate('assignedTo', 'name email').lean() as LeadType | null
    if (!lead) return notFoundResponse('Lead not found')

    if (user.role === 'agent') {
      const assignedId = (lead.assignedTo as { _id: string } | null)?._id?.toString()
        ?? (lead.assignedTo as string | null)
      if (assignedId !== user.userId) return forbiddenResponse()
    }

    const suggestions = generateAISuggestions(lead)
    const urgency = getFollowUpScore(lead)

    return successResponse({ suggestions, urgency })
  } catch (error) {
    console.error('[API/leads/:id/suggestions]', error)
    return errorResponse('Failed to generate suggestions', 500)
  }
}
