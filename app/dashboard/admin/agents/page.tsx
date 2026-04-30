'use client'
import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Users, TrendingUp, CheckCircle, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/types'
import { formatDate } from '@/lib/utils'

export default function AgentsPage() {
  const [agents, setAgents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAgents(d.data)
        else toast.error('Failed to load agents')
      })
      .catch(() => toast.error('Connection error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-title">Agents</h1>
          <p className="text-gray-500 text-sm">{agents.length} active agents</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : agents.length === 0 ? (
          <div className="card text-center py-20">
            <Users size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No agents found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {agents.map((agent) => (
              <div key={agent.id} className="card-hover animate-slide-up">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-card flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-crm-navy text-lg">{agent.name}</h3>
                    <p className="text-gray-400 text-sm truncate">{agent.email}</p>
                    {agent.phone && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone size={12} className="text-crm-purple" />
                        <p className="text-gray-400 text-xs">{agent.phone}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Joined {formatDate(agent.createdAt || '')}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-crm-purple/10 text-crm-purple">
                      Agent
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users size={14} className="text-crm-purple" />
                    </div>
                    <p className="text-xl font-bold text-crm-navy">{agent.stats?.total || 0}</p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle size={14} className="text-green-500" />
                    </div>
                    <p className="text-xl font-bold text-green-600">{agent.stats?.closed || 0}</p>
                    <p className="text-xs text-gray-400">Closed</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp size={14} className="text-crm-pink" />
                    </div>
                    <p className="text-xl font-bold text-crm-pink">
                      {(agent.stats?.total || 0) > 0
                        ? Math.round(((agent.stats?.closed || 0) / (agent.stats?.total || 1)) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-400">Conv.</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Conversion Rate</span>
                    <span className="text-xs font-semibold text-crm-purple">
                      {(agent.stats?.total || 0) > 0
                        ? Math.round(((agent.stats?.closed || 0) / (agent.stats?.total || 1)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-gradient-card h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${(agent.stats?.total || 0) > 0 ? Math.round(((agent.stats?.closed || 0) / (agent.stats?.total || 1)) * 100) : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
