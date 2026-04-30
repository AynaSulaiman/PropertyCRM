export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent'
  phone?: string
  isActive?: boolean
  createdAt?: string
  stats?: {
    total: number
    closed: number
  }
}

export interface Lead {
  _id: string
  name: string
  email?: string
  phone: string
  propertyInterest: string
  location?: string
  budget: number
  status: 'New' | 'Contacted' | 'In Progress' | 'Closed' | 'Lost'
  priority: 'High' | 'Medium' | 'Low'
  score: number
  notes?: string
  assignedTo?: User | null
  source: string
  followUpDate?: string
  lastActivityAt: string
  isStale: boolean
  createdAt: string
  updatedAt: string
}

export interface Activity {
  _id: string
  leadId: string | Lead
  action: string
  performedBy: User
  details: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface AnalyticsOverview {
  totalLeads: number
  totalAgents: number
  closedLeads: number
  conversionRate: number
  newLeadsToday: number
  overdueFollowups: number
  staleLeads: number
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  statusDistribution: { name: string; value: number }[]
  priorityDistribution: { name: string; value: number }[]
  sourceDistribution: { name: string; value: number }[]
  agentPerformance: {
    _id: string
    agentName: string
    agentEmail: string
    total: number
    new: number
    contacted: number
    inProgress: number
    closed: number
    lost: number
    highPriority: number
  }[]
  leadsOverTime: { date: string; count: number }[]
  recentActivity: Activity[]
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errors?: unknown
}

export interface PaginatedLeads {
  leads: Lead[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
