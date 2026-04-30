import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Lead from '@/models/Lead'
import User from '@/models/User'
import Activity from '@/models/Activity'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/apiResponse'
import { subDays, startOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()
    if (user.role !== 'admin') return forbiddenResponse('Admin access required')

    await connectDB()

    const now = new Date()
    const thirtyDaysAgo = startOfDay(subDays(now, 30))
    const sevenDaysAgo = startOfDay(subDays(now, 7))

    // Parallel data fetching
    const [
      totalLeads,
      statusDistribution,
      priorityDistribution,
      sourceDistribution,
      agentPerformance,
      leadsOverTime,
      overdueFollowups,
      staleLeads,
      recentActivity,
      totalAgents,
    ] = await Promise.all([
      Lead.countDocuments(),

      Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Lead.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Lead.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Lead.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'agent',
          },
        },
        { $unwind: { path: '$agent', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$assignedTo',
            agentName: { $first: '$agent.name' },
            agentEmail: { $first: '$agent.email' },
            total: { $sum: 1 },
            new: { $sum: { $cond: [{ $eq: ['$status', 'New'] }, 1, 0] } },
            contacted: { $sum: { $cond: [{ $eq: ['$status', 'Contacted'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
            lost: { $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] } },
            highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } },
          },
        },
        { $sort: { total: -1 } },
      ]),

      Lead.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),

      Lead.countDocuments({
        followUpDate: { $lt: now },
        status: { $nin: ['Closed', 'Lost'] },
      }),

      Lead.countDocuments({
        lastActivityAt: { $lt: sevenDaysAgo },
        status: { $nin: ['Closed', 'Lost'] },
      }),

      Activity.find()
        .populate('performedBy', 'name role')
        .populate('leadId', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      User.countDocuments({ role: 'agent', isActive: true }),
    ])

    const closedLeads = await Lead.countDocuments({ status: 'Closed' })
    const newLeadsToday = await Lead.countDocuments({
      createdAt: { $gte: startOfDay(now) },
    })

    const formattedLeadsOverTime = leadsOverTime.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      count: item.count,
    }))

    return successResponse({
      overview: {
        totalLeads,
        totalAgents,
        closedLeads,
        conversionRate: totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0,
        newLeadsToday,
        overdueFollowups,
        staleLeads,
      },
      statusDistribution: statusDistribution.map((s) => ({ name: s._id, value: s.count })),
      priorityDistribution: priorityDistribution.map((p) => ({ name: p._id, value: p.count })),
      sourceDistribution: sourceDistribution.map((s) => ({ name: s._id, value: s.count })),
      agentPerformance,
      leadsOverTime: formattedLeadsOverTime,
      recentActivity,
    })
  } catch (error) {
    console.error('[API/analytics GET]', error)
    return errorResponse('Failed to fetch analytics', 500)
  }
}
