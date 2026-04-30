'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LeadCard from '@/components/leads/LeadCard'
import LeadFilters from '@/components/leads/LeadFilters'
import LeadForm from '@/components/leads/LeadForm'
import AssignLeadModal from '@/components/leads/AssignLeadModal'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Plus, Download, Grid, List, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Lead } from '@/types'
import { useSocket } from '@/hooks/useSocket'
import { useAuth } from '@/hooks/useAuth'
import { formatBudget, getStatusClass, getPriorityClass, formatDate, getWhatsAppUrl, isOverdue } from '@/lib/utils'
import { cn } from '@/lib/utils'

const DEFAULT_FILTERS = { search: '', status: '', priority: '', source: '', sortBy: 'createdAt', sortOrder: 'desc' }

export default function AdminLeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [assignLead, setAssignLead] = useState<Lead | null>(null)
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null)
  const [deleting, setDeleting] = useState(false)
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

  // Real-time socket updates
  useSocket({
    userId: user?.id,
    role: user?.role,
    onLeadCreated: () => fetchLeads(1),
    onLeadUpdated: () => fetchLeads(pagination.page),
    onLeadDeleted: () => fetchLeads(pagination.page),
    onLeadAssigned: () => fetchLeads(pagination.page),
  })

  const handleDelete = async () => {
    if (!deleteLead) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/leads/${deleteLead._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Lead deleted')
        setLeads((prev) => prev.filter((l) => l._id !== deleteLead._id))
        setDeleteLead(null)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to delete lead')
    } finally {
      setDeleting(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Property Interest', 'Location', 'Budget', 'Status', 'Priority', 'Score', 'Source', 'Agent', 'Created']
    const rows = leads.map((l) => [
      l.name, l.phone, l.email || '', l.propertyInterest, l.location || '',
      formatBudget(l.budget), l.status, l.priority, l.score,
      l.source, (l.assignedTo as { name: string })?.name || 'Unassigned', formatDate(l.createdAt),
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Leads exported to CSV')
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">All Leads</h1>
            <p className="text-gray-500 text-sm">{pagination.total} total leads</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportToCSV} className="btn-secondary text-sm flex items-center gap-2">
              <Download size={16} /> Export CSV
            </button>
            <div className="flex bg-white border border-crm-silver rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('table')} className={cn('p-2 transition-colors', viewMode === 'table' ? 'bg-crm-purple text-white' : 'text-gray-400 hover:text-crm-purple')}>
                <List size={18} />
              </button>
              <button onClick={() => setViewMode('grid')} className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-crm-purple text-white' : 'text-gray-400 hover:text-crm-purple')}>
                <Grid size={18} />
              </button>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm flex items-center gap-2">
              <Plus size={16} /> New Lead
            </button>
          </div>
        </div>

        {/* Filters */}
        <LeadFilters filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : leads.length === 0 ? (
          <div className="card text-center py-20">
            <Building2 size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No leads found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or create a new lead</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} /> Create First Lead
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead}
                href={`/dashboard/admin/leads/${lead._id}`}
                onAssign={() => setAssignLead(lead)}
                showAgent
              />
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-500">Lead</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-500">Property</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-500">Budget</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-500">Priority</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-500">Status</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-500">Agent</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-500">Follow-up</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-500">Created</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead._id} className="border-b border-gray-50 hover:bg-purple-50 transition-colors table-row-hover">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-crm-navy">{lead.name}</p>
                          <p className="text-xs text-gray-400">{lead.phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-crm-navy">{lead.propertyInterest}</p>
                        <p className="text-xs text-gray-400">{lead.location || 'N/A'}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-crm-purple">{formatBudget(lead.budget)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={getPriorityClass(lead.priority)}>{lead.priority}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={getStatusClass(lead.status)}>{lead.status}</span>
                      </td>
                      <td className="py-3 px-3">
                        {lead.assignedTo ? (
                          <span className="text-crm-navy text-xs font-medium">{(lead.assignedTo as { name: string }).name}</span>
                        ) : (
                          <button onClick={() => setAssignLead(lead)} className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                            ⚠ Assign
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {lead.followUpDate ? (
                          <span className={cn('text-xs', isOverdue(lead.followUpDate) ? 'text-red-500 font-semibold' : 'text-gray-500')}>
                            {isOverdue(lead.followUpDate) ? '⚠ ' : ''}{formatDate(lead.followUpDate)}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">None</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-400">{formatDate(lead.createdAt)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 justify-center">
                          <a href={`/dashboard/admin/leads/${lead._id}`} className="text-crm-purple hover:text-crm-pink text-xs font-medium px-2 py-1 rounded hover:bg-purple-50 transition-colors">
                            View
                          </a>
                          <button onClick={() => setAssignLead(lead)} className="text-crm-purple hover:text-crm-pink text-xs font-medium px-2 py-1 rounded hover:bg-purple-50 transition-colors">
                            Assign
                          </button>
                          <a href={getWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 text-xs font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors">
                            WA
                          </a>
                          <button onClick={() => setDeleteLead(lead)} className="text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {leads.length} of {pagination.total} leads
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => fetchLeads(pagination.page - 1)}
                    className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 px-3 py-1.5">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => fetchLeads(pagination.page + 1)}
                    className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Lead" size="xl">
        <LeadForm
          onSuccess={(lead) => {
            setLeads((prev) => [lead, ...prev])
            setShowCreateModal(false)
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Assign Lead Modal */}
      <AssignLeadModal
        isOpen={!!assignLead}
        onClose={() => setAssignLead(null)}
        lead={assignLead}
        onSuccess={(updated) => {
          setLeads((prev) => prev.map((l) => l._id === updated._id ? updated : l))
          setAssignLead(null)
        }}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteLead}
        onClose={() => setDeleteLead(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete "${deleteLead?.name}"? This action cannot be undone and all activity history will be lost.`}
        confirmLabel="Delete Lead"
        isLoading={deleting}
      />
    </DashboardLayout>
  )
}
