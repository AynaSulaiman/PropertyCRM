'use client'
import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart,
} from 'recharts'
import { Users, TrendingUp, CheckCircle, AlertTriangle, Clock, Zap, Building2, Activity } from 'lucide-react'
import { formatDate, timeAgo, getActivityIcon } from '@/lib/utils'
import type { AnalyticsData } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const STATUS_COLORS = ['#39375B', '#745C97', '#DC6ACF', '#10b981', '#ef4444']
const PRIORITY_COLORS = { High: '#DC6ACF', Medium: '#745C97', Low: '#C4BBB8' }

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics')
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {
      console.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchAnalytics])

  if (loading) {
    return (
      <DashboardLayout requiredRole="admin">
        <LoadingSpinner size="lg" text="Loading analytics..." className="mt-20" />
      </DashboardLayout>
    )
  }

  const ov = data?.overview

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Analytics Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time overview of your CRM system</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Activity size={16} /> Refresh
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={ov?.totalLeads ?? 0}
            icon={<Building2 size={22} className="text-crm-purple" />}
            trend="All time"
          />
          <StatCard
            title="Active Agents"
            value={ov?.totalAgents ?? 0}
            icon={<Users size={22} className="text-crm-purple" />}
          />
          <StatCard
            title="Deals Closed"
            value={ov?.closedLeads ?? 0}
            icon={<CheckCircle size={22} className="text-green-500" />}
            trend={`${ov?.conversionRate ?? 0}% conversion`}
            trendUp
          />
          <StatCard
            title="New Today"
            value={ov?.newLeadsToday ?? 0}
            icon={<Zap size={22} className="text-crm-pink" />}
            gradient
          />
        </div>

        {/* Alert Stats */}
        {((ov?.overdueFollowups ?? 0) > 0 || (ov?.staleLeads ?? 0) > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(ov?.overdueFollowups ?? 0) > 0 && (
              <StatCard
                title="Overdue Follow-ups"
                value={ov?.overdueFollowups ?? 0}
                icon={<AlertTriangle size={22} className="text-red-500" />}
                alert
              />
            )}
            {(ov?.staleLeads ?? 0) > 0 && (
              <StatCard
                title="Stale Leads (7d+ inactive)"
                value={ov?.staleLeads ?? 0}
                icon={<Clock size={22} className="text-orange-500" />}
                alert
              />
            )}
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Distribution */}
          <div className="card">
            <h2 className="section-title mb-4">Lead Status</h2>
            {data?.statusDistribution && data.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.statusDistribution.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(v) => [v, 'Leads']}
                  />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-10 text-sm">No data yet</p>
            )}
          </div>

          {/* Priority Distribution */}
          <div className="card">
            <h2 className="section-title mb-4">Priority Levels</h2>
            {data?.priorityDistribution && data.priorityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.priorityDistribution}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.priorityDistribution.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || '#C4BBB8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(v) => [v, 'Leads']}
                  />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-10 text-sm">No data yet</p>
            )}
          </div>

          {/* Source Distribution */}
          <div className="card">
            <h2 className="section-title mb-4">Lead Sources</h2>
            {data?.sourceDistribution && data.sourceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.sourceDistribution} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" fill="#745C97" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-10 text-sm">No data yet</p>
            )}
          </div>
        </div>

        {/* Leads Over Time */}
        <div className="card">
          <h2 className="section-title mb-4">Leads Over Last 30 Days</h2>
          {data?.leadsOverTime && data.leadsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.leadsOverTime}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#745C97" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#745C97" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#745C97" strokeWidth={2} fill="url(#colorLeads)" name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10 text-sm">No lead data for the last 30 days</p>
          )}
        </div>

        {/* Agent Performance */}
        {data?.agentPerformance && data.agentPerformance.length > 0 && (
          <div className="card">
            <h2 className="section-title mb-4">Agent Performance Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-gray-500 font-semibold">Agent</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-semibold">Total</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-semibold">New</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-semibold">Contacted</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-semibold">In Progress</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-semibold">Closed</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-semibold">Lost</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-semibold">High Priority</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-semibold">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agentPerformance.map((agent, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-purple-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-card flex items-center justify-center text-white font-bold text-xs">
                            {(agent.agentName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-crm-navy">{agent.agentName || 'Unassigned'}</p>
                            <p className="text-xs text-gray-400">{agent.agentEmail || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3 font-bold text-crm-navy">{agent.total}</td>
                      <td className="text-center py-3 px-3"><span className="status-new">{agent.new}</span></td>
                      <td className="text-center py-3 px-3"><span className="status-contacted">{agent.contacted}</span></td>
                      <td className="text-center py-3 px-3"><span className="status-in-progress">{agent.inProgress}</span></td>
                      <td className="text-center py-3 px-3"><span className="status-closed">{agent.closed}</span></td>
                      <td className="text-center py-3 px-3"><span className="status-lost">{agent.lost}</span></td>
                      <td className="text-center py-3 px-3">
                        <span className="badge-high">{agent.highPriority}</span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className={`font-bold ${agent.total > 0 && (agent.closed / agent.total) > 0.5 ? 'text-green-600' : 'text-gray-600'}`}>
                          {agent.total > 0 ? Math.round((agent.closed / agent.total) * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {data?.recentActivity && data.recentActivity.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Recent Activity</h2>
              <span className="text-xs text-gray-400">Live feed</span>
            </div>
            <div className="space-y-3">
              {data.recentActivity.map((activity) => (
                <div key={activity._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-sm flex-shrink-0">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-crm-navy font-medium">{activity.details}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        by {(activity.performedBy as { name: string })?.name || 'Unknown'}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{timeAgo(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unassigned Leads Warning */}
        {data && (
          <div className="card border-crm-pink-light bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <TrendingUp size={24} className="text-crm-purple flex-shrink-0" />
              <div>
                <p className="font-semibold text-crm-navy">System Health</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {ov?.conversionRate ?? 0}% conversion rate •{' '}
                  {ov?.overdueFollowups ?? 0} overdue follow-ups •{' '}
                  {ov?.staleLeads ?? 0} stale leads requiring attention
                </p>
              </div>
              <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${(ov?.overdueFollowups ?? 0) === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {(ov?.overdueFollowups ?? 0) === 0 ? 'Healthy' : 'Needs Attention'}
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
