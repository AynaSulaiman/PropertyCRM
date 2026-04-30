'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { Building2, CheckCircle, Clock, AlertCircle, ArrowRight, MessageCircle, Phone } from 'lucide-react'
import { formatBudget, getStatusClass, getPriorityClass, getWhatsAppUrl, isOverdue, formatDate, timeAgo } from '@/lib/utils'
import type { Lead } from '@/types'
import { cn } from '@/lib/utils'

export default function AgentDashboard() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads?limit=50')
      const data = await res.json()
      if (data.success) setLeads(data.data.leads)
    } catch {
      console.error('Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const stats = {
    total: leads.length,
    active: leads.filter((l) => !['Closed', 'Lost'].includes(l.status)).length,
    closed: leads.filter((l) => l.status === 'Closed').length,
    overdue: leads.filter((l) => isOverdue(l.followUpDate) && !['Closed', 'Lost'].includes(l.status)).length,
    high: leads.filter((l) => l.priority === 'High').length,
  }

  const overdueLeads = leads.filter((l) => isOverdue(l.followUpDate) && !['Closed', 'Lost'].includes(l.status))
  const highPriorityLeads = leads.filter((l) => l.priority === 'High' && !['Closed', 'Lost'].includes(l.status)).slice(0, 5)
  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

  return (
    <DashboardLayout requiredRole="agent">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s your leads overview for today</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: stats.total, icon: Building2, color: 'text-crm-purple', bg: 'bg-purple-50' },
            { label: 'Active', value: stats.active, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Closed', value: stats.closed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', alert: stats.overdue > 0 },
          ].map((s) => (
            <div key={s.label} className={cn('card flex items-center gap-4', s.alert && 'border-red-200 bg-red-50')}>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
                <s.icon size={22} className={s.color} />
              </div>
              <div>
                <p className={cn('text-2xl font-bold', s.alert ? 'text-red-700' : 'text-crm-navy')}>{s.value}</p>
                <p className={cn('text-sm', s.alert ? 'text-red-600' : 'text-gray-500')}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Overdue Follow-ups Alert */}
        {overdueLeads.length > 0 && (
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-500" />
                <h2 className="font-bold text-red-700">⚠ Overdue Follow-ups ({overdueLeads.length})</h2>
              </div>
              <Link href="/dashboard/agent/leads?status=&priority=" className="text-sm text-red-600 font-medium hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {overdueLeads.slice(0, 3).map((lead) => (
                <div key={lead._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-red-800 text-sm">{lead.name}</p>
                      <p className="text-xs text-red-400">Due: {formatDate(lead.followUpDate!)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={getWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-500 text-white rounded-lg">
                      <MessageCircle size={14} />
                    </a>
                    <Link href={`/dashboard/agent/leads/${lead._id}`} className="text-xs font-medium text-crm-purple hover:text-crm-pink px-2 py-1 bg-purple-50 rounded-lg">
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High Priority Leads */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">🔥 High Priority Leads</h2>
              <Link href="/dashboard/agent/leads?priority=High" className="text-xs text-crm-purple font-medium hover:text-crm-pink">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner" /></div>
            ) : highPriorityLeads.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No high priority leads</p>
            ) : (
              <div className="space-y-3">
                {highPriorityLeads.map((lead) => (
                  <div key={lead._id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-crm-pink/20">
                    <div className="w-2 h-2 rounded-full bg-crm-pink flex-shrink-0 priority-high-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-crm-navy text-sm">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.propertyInterest} · {formatBudget(lead.budget)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a href={getWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-500 text-white rounded-lg">
                        <MessageCircle size={12} />
                      </a>
                      <Link href={`/dashboard/agent/leads/${lead._id}`} className="p-1.5 bg-crm-purple/10 text-crm-purple rounded-lg hover:bg-crm-purple hover:text-white transition-colors">
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Leads */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Recent Leads</h2>
              <Link href="/dashboard/agent/leads" className="text-xs text-crm-purple font-medium hover:text-crm-pink">
                View all →
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner" /></div>
            ) : recentLeads.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No leads assigned yet</p>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-crm-purple text-sm flex-shrink-0">
                      {lead.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-crm-navy text-sm">{lead.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={getStatusClass(lead.status)}>{lead.status}</span>
                        <span className="text-xs text-gray-400">{timeAgo(lead.createdAt)}</span>
                      </div>
                    </div>
                    <Link href={`/dashboard/agent/leads/${lead._id}`} className="opacity-0 group-hover:opacity-100 text-crm-purple transition-opacity">
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Link */}
        <div className="card bg-gradient-to-r from-crm-navy to-crm-purple text-white flex items-center justify-between p-5">
          <div>
            <p className="font-bold text-lg">View All Your Leads</p>
            <p className="text-white/70 text-sm mt-0.5">{stats.active} active leads need your attention</p>
          </div>
          <Link href="/dashboard/agent/leads" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
            My Leads <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
