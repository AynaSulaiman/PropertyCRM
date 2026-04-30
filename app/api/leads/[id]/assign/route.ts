import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Lead from '@/models/Lead'
import User from '@/models/User'
import Activity from '@/models/Activity'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/apiResponse'
import { sendLeadAssignmentEmail } from '@/lib/email'
import mongoose from 'mongoose'

function emitSocket(event: string, room: string, data: object) {
  try {
    const io = (global as unknown as Record<string, unknown>).__socketio__
    if (io && typeof (io as Record<string, unknown>).to === 'function') {
      const ioServer = io as { to: (room: string) => { emit: (event: string, data: object) => void } }
      ioServer.to(room).emit(event, data)
    }
  } catch {}
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const currentUser = verifyToken(token)
    if (!currentUser) return unauthorizedResponse()
    if (currentUser.role !== 'admin') return forbiddenResponse('Only admins can assign leads')

    if (!mongoose.Types.ObjectId.isValid(params.id)) return notFoundResponse('Invalid lead ID')

    const { agentId } = await request.json()
    if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
      return errorResponse('Valid agent ID is required', 400)
    }

    await connectDB()

    const [lead, agent] = await Promise.all([
      Lead.findById(params.id),
      User.findById(agentId),
    ])

    if (!lead) return notFoundResponse('Lead not found')
    if (!agent || agent.role !== 'agent') return notFoundResponse('Agent not found')

    const wasAssigned = lead.assignedTo
    const action = wasAssigned ? 'reassigned' : 'assigned'

    const previousAgent = wasAssigned
      ? await User.findById(wasAssigned).select('name')
      : null

    lead.assignedTo = new mongoose.Types.ObjectId(agentId)
    lead.lastActivityAt = new Date()
    await lead.save()

    const populatedLead = await Lead.findById(lead._id).populate('assignedTo', 'name email phone').lean()

    const activityDetails = wasAssigned
      ? `Lead reassigned from "${previousAgent?.name || 'Unknown'}" to "${agent.name}" by ${currentUser.name}`
      : `Lead assigned to "${agent.name}" by ${currentUser.name}`

    await Activity.create({
      leadId: lead._id,
      action,
      performedBy: currentUser.userId,
      details: activityDetails,
      metadata: { agentId, agentName: agent.name, previousAgentId: wasAssigned },
    })

    // Send email notification to agent
    const admin = await User.findById(currentUser.userId).select('name')
    await sendLeadAssignmentEmail({
      leadName: lead.name,
      leadPhone: lead.phone,
      propertyInterest: lead.propertyInterest,
      budget: lead.budget,
      agentName: agent.name,
      agentEmail: agent.email,
      adminName: admin?.name || currentUser.name,
    }).catch(() => {})

    // Real-time notifications
    emitSocket('lead_assigned', 'admin', { lead: populatedLead, agentId, message: `Lead assigned to ${agent.name}` })
    emitSocket('lead_assigned', `user_${agentId}`, { lead: populatedLead, agentId, message: `New lead "${lead.name}" assigned to you` })

    return successResponse(populatedLead, `Lead successfully ${action} to ${agent.name}`)
  } catch (error) {
    console.error('[API/leads/:id/assign]', error)
    return errorResponse('Failed to assign lead', 500)
  }
}
