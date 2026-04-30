import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Lead from '@/models/Lead'
import Activity from '@/models/Activity'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/apiResponse'
import mongoose from 'mongoose'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()

    if (!mongoose.Types.ObjectId.isValid(params.id)) return notFoundResponse('Invalid lead ID')

    const { followUpDate } = await request.json()
    if (!followUpDate) return errorResponse('Follow-up date is required', 400)

    const date = new Date(followUpDate)
    if (isNaN(date.getTime())) return errorResponse('Invalid date format', 400)

    await connectDB()

    const lead = await Lead.findById(params.id)
    if (!lead) return notFoundResponse('Lead not found')

    if (user.role === 'agent' && lead.assignedTo?.toString() !== user.userId) {
      return forbiddenResponse()
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      params.id,
      { followUpDate: date, lastActivityAt: new Date() },
      { new: true }
    ).populate('assignedTo', 'name email')

    await Activity.create({
      leadId: params.id,
      action: 'followup_set',
      performedBy: user.userId,
      details: `Follow-up scheduled for ${date.toLocaleDateString('en-PK')}`,
      metadata: { followUpDate: date },
    })

    return successResponse(updatedLead, 'Follow-up date set successfully')
  } catch (error) {
    console.error('[API/leads/:id/followup]', error)
    return errorResponse('Failed to set follow-up date', 500)
  }
}
