'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AssignLeadModal from '@/components/leads/AssignLeadModal'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LeadForm from '@/components/leads/LeadForm'
import { ArrowLeft, Phone, MessageCircle, Mail, MapPin, Calendar, Edit, Trash2, UserCheck, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  formatBudget, formatDate, formatDateTime, getWhatsAppUrl,
  getPriorityClass, getStatusClass, getActivityIcon, timeAgo, isOverdue
} from '@/lib/utils'
import type { Lead, Activity } from '@/types'
import { cn } from '@/lib/utils'

export default function AdminLeadDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [savingFollowUp, setSavingFollowUp] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details')

  const fetchLead = useCallback(async () => {
    try {
      const [leadRes, actRes] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch(`/api/leads/${id}/activities`),
      ])
      const [leadData, actData] = await Promise.all([leadRes.json(), actRes.json()])
      if (leadData.success) setLead(leadData.data)
      if (actData.success) setActivities(actData.data)
    } catch {
      toast.error('Failed to load lead details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchLead() }, [fetchLead])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Lead deleted')
        router.push('/dashboard/admin/leads')
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const handleSetFollowUp = async () => {
    if (!followUpDate) return
    setSavingFollowUp(true)
    try {
      const res = await fetch(`/api/leads/${id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpDate }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Follow-up date set')
        setLead(data.data)
        setShowFollowUp(false)
        fetchLead()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to set follow-up')
    } finally {
      setSavingFollowUp(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="flex justify-center py-20">
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      </DashboardLayout>
    )
  }

  if (!lead) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="text-center py-20">
          <p className="text-gray-500">Lead not found</p>
          <button onClick={() => router.push('/dashboard/admin/leads')} className="btn-primary mt-4">Back to Leads</button>
        </div>
      </DashboardLayout>
    )
  }

  const overdue = isOverdue(lead.followUpDate)

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="page-title">{lead.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={getPriorityClass(lead.priority)}>{lead.priority} Priority</span>
                <span className={getStatusClass(lead.status)}>{lead.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={getWhatsAppUrl(lead.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <button onClick={() => setShowFollowUp(true)} className="btn-secondary text-sm flex items-center gap-2">
              <Clock size={16} /> Set Follow-up
            </button>
            <button onClick={() => setShowAssign(true)} className="btn-secondary text-sm flex items-center gap-2">
              <UserCheck size={16} /> {lead.assignedTo ? 'Reassign' : 'Assign'}
            </button>
            <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm flex items-center gap-2">
              <Edit size={16} /> Edit
            </button>
            <button onClick={() => setShowDelete(true)} className="btn-danger text-sm flex items-center gap-2">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {/* Overdue Alert */}
        {overdue && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm font-medium">
              Follow-up overdue since {formatDate(lead.followUpDate!)} — contact this lead immediately!
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          {(['details', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3 text-sm font-semibold capitalize border-b-2 transition-colors',
                activeTab === tab ? 'text-crm-purple border-crm-purple' : 'text-gray-400 border-transparent hover:text-crm-navy'
              )}
            >
              {tab === 'activity' ? `Activity Log (${activities.length})` : 'Lead Details'}
            </button>
          ))}
        </div>

        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <h2 className="section-title mb-4">Contact Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Phone size={18} className="text-crm-purple flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-semibold text-crm-navy text-sm">{lead.phone}</p>
                    </div>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Mail size={18} className="text-crm-purple flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-semibold text-crm-navy text-sm truncate">{lead.email}</p>
                      </div>
                    </div>
                  )}
                  {lead.location && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <MapPin size={18} className="text-crm-purple flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-semibold text-crm-navy text-sm">{lead.location}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Calendar size={18} className="text-crm-purple flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="font-semibold text-crm-navy text-sm">{formatDateTime(lead.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="section-title mb-4">Property Requirements</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Property Type', value: lead.propertyInterest },
                    { label: 'Budget', value: formatBudget(lead.budget) },
                    { label: 'Source', value: lead.source },
                    { label: 'Lead Score', value: `${lead.score}/100` },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <p className="font-semibold text-crm-navy">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {lead.notes && (
                <div className="card">
                  <h2 className="section-title mb-3">Notes</h2>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Assignment */}
              <div className="card">
                <h2 className="section-title mb-3">Assignment</h2>
                {lead.assignedTo ? (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-card flex items-center justify-center text-white font-bold">
                      {(lead.assignedTo as { name: string }).name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-crm-navy">{(lead.assignedTo as { name: string }).name}</p>
                      <p className="text-xs text-gray-400">{(lead.assignedTo as { email: string }).email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-gray-400 text-sm mb-3">Not yet assigned</p>
                    <button onClick={() => setShowAssign(true)} className="btn-primary text-sm w-full">
                      Assign Agent
                    </button>
                  </div>
                )}
              </div>

              {/* Follow-up */}
              <div className="card">
                <h2 className="section-title mb-3">Follow-up</h2>
                {lead.followUpDate ? (
                  <div className={cn('p-3 rounded-lg', overdue ? 'bg-red-50' : 'bg-blue-50')}>
                    <div className="flex items-center gap-2">
                      {overdue ? <AlertCircle size={16} className="text-red-500" /> : <Clock size={16} className="text-blue-500" />}
                      <p className={cn('font-semibold text-sm', overdue ? 'text-red-700' : 'text-blue-700')}>
                        {formatDate(lead.followUpDate)}
                      </p>
                    </div>
                    {overdue && <p className="text-xs text-red-500 mt-1">OVERDUE</p>}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No follow-up scheduled</p>
                )}
                <button onClick={() => setShowFollowUp(true)} className="btn-secondary text-sm w-full mt-3">
                  {lead.followUpDate ? 'Update Follow-up' : 'Set Follow-up'}
                </button>
              </div>

              {/* Quick stats */}
              <div className="card bg-gradient-to-br from-crm-navy to-crm-purple text-white">
                <h2 className="text-white font-semibold mb-3">Lead Score</h2>
                <div className="text-center">
                  <p className="text-5xl font-black text-crm-pink-light">{lead.score}</p>
                  <p className="text-white/70 text-sm mt-1">out of 100</p>
                </div>
                <div className="mt-3 bg-white/20 rounded-full h-2">
                  <div className="bg-crm-pink-light h-2 rounded-full transition-all" style={{ width: `${lead.score}%` }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Activity Timeline */
          <div className="card">
            <h2 className="section-title mb-5">Activity Timeline</h2>
            {activities.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No activities recorded yet</p>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-4">
                  {activities.map((activity, i) => (
                    <div key={activity._id} className="flex gap-4 relative">
                      <div className="w-12 h-12 rounded-full bg-purple-50 border-2 border-white flex items-center justify-center text-xl flex-shrink-0 z-10 shadow-sm">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className={cn('flex-1 p-3 rounded-xl', i === 0 ? 'bg-purple-50 border border-crm-pink-light' : 'bg-gray-50')}>
                        <p className="font-semibold text-crm-navy text-sm">{activity.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {(activity.performedBy as { name: string })?.name || 'System'}
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{timeAgo(activity.createdAt)}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{formatDateTime(activity.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AssignLeadModal isOpen={showAssign} onClose={() => setShowAssign(false)} lead={lead} onSuccess={(updated) => { setLead(updated); fetchLead() }} />

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Lead" size="xl">
        <LeadForm
          initialData={lead}
          isEdit
          onSuccess={(updated) => { setLead(updated); setShowEdit(false); fetchLead() }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      <Modal isOpen={showFollowUp} onClose={() => setShowFollowUp(false)} title="Set Follow-up Date" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Schedule a follow-up for <strong>{lead?.name}</strong></p>
          <div>
            <label className="label">Follow-up Date</label>
            <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="input-field" min={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setShowFollowUp(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSetFollowUp} disabled={savingFollowUp || !followUpDate}>
              {savingFollowUp ? 'Saving...' : 'Set Date'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Delete "${lead?.name}"? This will permanently remove all data and activity history.`}
        confirmLabel="Delete Lead"
        isLoading={deleting}
      />
    </DashboardLayout>
  )
}
