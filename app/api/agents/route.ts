import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Lead from '@/models/Lead'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()
    if (user.role !== 'admin') return forbiddenResponse('Admin access required')

    await connectDB()

    const agents = await User.find({ role: 'agent', isActive: true })
      .select('name email phone isActive createdAt')
      .lean()

    // Get lead counts per agent
    const leadCounts = await Lead.aggregate([
      { $group: { _id: '$assignedTo', total: { $sum: 1 }, closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } } } },
    ])

    const leadMap = new Map(leadCounts.map((l) => [l._id?.toString(), { total: l.total, closed: l.closed }]))

    const agentsWithStats = agents.map((agent) => ({
      ...agent,
      stats: leadMap.get(String(agent._id)) || { total: 0, closed: 0 },
    }))

    return successResponse(agentsWithStats)
  } catch (error) {
    console.error('[API/agents GET]', error)
    return errorResponse('Failed to fetch agents', 500)
  }
}
