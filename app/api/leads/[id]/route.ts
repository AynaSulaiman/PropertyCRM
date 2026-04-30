import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Lead from '@/models/Lead'
import Activity from '@/models/Activity'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/apiResponse'
import mongoose from 'mongoose'

function emitSocket(event: string, data: object) {
  try {
    const io = (global as unknown as Record<string, unknown>).__socketio__
    if (io && typeof (io as Record<string, unknown>).to === 'function') {
      const ioServer = io as { to: (room: string) => { emit: (event: string, data: object) => void } }
      ioServer.to('admin').emit(event, data)
    }
  } catch {}
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()

    if (!mongoose.Types.ObjectId.isValid(params.id)) return notFoundResponse('Invalid lead ID')

    await connectDB()
    const lead = await Lead.findById(params.id).populate('assignedTo', 'name email phone').lean() as Record<string, unknown> | null

    if (!lead) return notFoundResponse('Lead not found')

    // Agents can only view their assigned leads
    if (user.role === 'agent' && lead.assignedTo) {
      const assignedTo = lead.assignedTo as { _id: mongoose.Types.ObjectId }
      const assignedId = assignedTo._id?.toString()
      if (assignedId !== user.userId) return forbiddenResponse()
    }

    return successResponse(lead)
  } catch (error) {
    console.error('[API/leads/:id GET]', error)
    return errorResponse('Failed to fetch lead', 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()

    if (!mongoose.Types.ObjectId.isValid(params.id)) return notFoundResponse('Invalid lead ID')

    await connectDB()

    const existingLead = await Lead.findById(params.id)
    if (!existingLead) return notFoundResponse('Lead not found')

    // Agents can only update their assigned leads, and only certain fields
    if (user.role === 'agent') {
      const assignedId = existingLead.assignedTo?.toString()
      if (assignedId !== user.userId) return forbiddenResponse()
    }

    const body = await request.json()
    const activities: { action: string; details: string; metadata?: object }[] = []

    // Track field changes for activity log
    if (body.status && body.status !== existingLead.status) {
      activities.push({
        action: 'status_updated',
        details: `Status changed from "${existingLead.status}" to "${body.status}"`,
        metadata: { from: existingLead.status, to: body.status },
      })
    }
    if (body.notes && body.notes !== existingLead.notes) {
      activities.push({ action: 'notes_updated', details: 'Notes were updated' })
    }
    if (body.budget !== undefined && body.budget !== existingLead.budget) {
      activities.push({
        action: 'budget_updated',
        details: `Budget updated from ${existingLead.budget} to ${body.budget}`,
        metadata: { from: existingLead.budget, to: body.budget },
      })
    }

    // Agents can only update: status, notes, followUpDate
    const allowedAgentFields = ['status', 'notes', 'followUpDate']
    const updateData = user.role === 'agent'
      ? Object.fromEntries(Object.entries(body).filter(([k]) => allowedAgentFields.includes(k)))
      : body

    const updatedLead = await Lead.findByIdAndUpdate(
      params.id,
      { ...updateData, lastActivityAt: new Date() },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email phone')

    // Save activities
    await Promise.all(
      activities.map((act) =>
        Activity.create({
          leadId: params.id,
          action: act.action,
          performedBy: user.userId,
          details: act.details,
          metadata: act.metadata,
        })
      )
    )

    emitSocket('lead_updated', { lead: updatedLead, message: `Lead "${updatedLead?.name}" updated` })

    return successResponse(updatedLead, 'Lead updated successfully')
  } catch (error) {
    console.error('[API/leads/:id PUT]', error)
    return errorResponse('Failed to update lead', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()
    if (user.role !== 'admin') return forbiddenResponse('Only admins can delete leads')

    if (!mongoose.Types.ObjectId.isValid(params.id)) return notFoundResponse('Invalid lead ID')

    await connectDB()
    const lead = await Lead.findByIdAndDelete(params.id)
    if (!lead) return notFoundResponse('Lead not found')

    await Activity.deleteMany({ leadId: params.id })

    emitSocket('lead_deleted', { leadId: params.id, message: `Lead "${lead.name}" deleted` })

    return successResponse(null, 'Lead deleted successfully')
  } catch (error) {
    console.error('[API/leads/:id DELETE]', error)
    return errorResponse('Failed to delete lead', 500)
  }
}
