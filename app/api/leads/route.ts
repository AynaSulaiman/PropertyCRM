import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Lead from '@/models/Lead'
import Activity from '@/models/Activity'
import User from '@/models/User'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/apiResponse'
import { sendNewLeadEmail } from '@/lib/email'

function emitSocket(event: string, data: object) {
  try {
    const io = (global as unknown as Record<string, unknown>).__socketio__
    if (io && typeof (io as Record<string, unknown>).to === 'function') {
      const ioServer = io as { to: (room: string) => { emit: (event: string, data: object) => void } }
      ioServer.to('admin').emit(event, data)
    }
  } catch {}
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {}

    // Agents only see their assigned leads
    if (user.role === 'agent') {
      query.assignedTo = user.userId
    }

    if (status) query.status = status
    if (priority) query.priority = priority
    if (source) query.source = source
    if (assignedTo && user.role === 'admin') query.assignedTo = assignedTo
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ]
    }

    const total = await Lead.countDocuments(query)
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email phone')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return successResponse({
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API/leads GET]', error)
    return errorResponse('Failed to fetch leads', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const currentUser = verifyToken(token)
    if (!currentUser) return unauthorizedResponse()

    // Only admins can create leads
    if (currentUser.role !== 'admin') return forbiddenResponse('Only admins can create leads')

    const body = await request.json()
    const { name, phone, email, propertyInterest, budget, status, notes, source, location, assignedTo, followUpDate } = body

    if (!name || !phone || !propertyInterest || budget === undefined) {
      return errorResponse('Name, phone, property interest, and budget are required', 400)
    }
    if (budget < 0) return errorResponse('Budget cannot be negative', 400)

    await connectDB()

    const lead = await Lead.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      propertyInterest,
      budget: Number(budget),
      status: status || 'New',
      notes: notes?.trim(),
      source: source || 'Other',
      location: location?.trim(),
      assignedTo: assignedTo || null,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    })

    const populatedLead = await Lead.findById(lead._id).populate('assignedTo', 'name email phone').lean()

    // Activity log
    await Activity.create({
      leadId: lead._id,
      action: 'created',
      performedBy: currentUser.userId,
      details: `Lead "${name}" created by ${currentUser.name}`,
      metadata: { source, budget },
    })

    // Email notification to admin
    const adminUsers = await User.find({ role: 'admin' }).select('email')
    for (const admin of adminUsers) {
      await sendNewLeadEmail({
        leadName: name,
        leadPhone: phone,
        leadEmail: email,
        propertyInterest,
        budget: Number(budget),
        source: source || 'Other',
        priority: lead.priority,
        adminEmail: admin.email,
      }).catch(() => {}) // Non-blocking
    }

    // Emit real-time event
    emitSocket('lead_created', { lead: populatedLead, message: `New lead: ${name}` })

    return successResponse(populatedLead, 'Lead created successfully', 201)
  } catch (error) {
    console.error('[API/leads POST]', error)
    return errorResponse('Failed to create lead', 500)
  }
}
