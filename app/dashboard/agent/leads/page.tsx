'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LeadCard from '@/components/leads/LeadCard'
import LeadFilters from '@/components/leads/LeadFilters'
import { Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Lead } from '@/types'
import { useSocket } from '@/hooks/useSocket'
import { useAuth } from '@/hooks/useAuth'

const DEFAULT_FILTERS = { search: '', status: '', priority: '', source: '', sortBy: 'score', sortOrder: 'desc' }

export default function AgentLeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.source && { source: filters.source }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })
      const res = await fetch(`/api/leads?${params}`)
      const data = await res.json()
      if (data.success) {
        setLeads(data.data.leads)
        setPagination({ total: data.data.pagination.total, page, totalPages: data.data.pagination.totalPages })
      }
    } catch {
      toast.error('Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchLeads(1), filters.search ? 400 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [fetchLeads, filters])

  useSocket({
    userId: user?.id,
    role: user?.role,
    onLeadAssigned: () => fetchLeads(1),
    onLeadUpdated: () => fetchLeads(pagination.page),
  })

  return (
    <DashboardLayout requiredRole="agent">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="page-title">My Leads</h1>
          <p className="text-gray-500 text-sm">{pagination.total} leads assigned to you</p>
        </div>

        <LeadFilters filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : leads.length === 0 ? (
          <div className="card text-center py-20">
            <Building2 size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No leads assigned to you yet</p>
            <p className="text-gray-400 text-sm mt-1">Contact your admin to assign leads</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {leads.map((lead) => (
                <LeadCard
                  key={lead._id}
                  lead={lead}
                  href={`/dashboard/agent/leads/${lead._id}`}
                />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => fetchLeads(pagination.page - 1)}
                  className="btn-secondary text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">{pagination.page} / {pagination.totalPages}</span>
                <button
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchLeads(pagination.page + 1)}
                  className="btn-secondary text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
