'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import { ArrowLeft, Phone, MessageCircle, Mail, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  formatBudget, formatDate, formatDateTime, getWhatsAppUrl,
  getPriorityClass, getStatusClass, getActivityIcon, timeAgo, isOverdue
} from '@/lib/utils'
import type { Lead, Activity } from '@/types'
import { cn } from '@/lib/utils'

const STATUSES = ['New', 'Contacted', 'In Progress', 'Closed', 'Lost']

export default function AgentLeadDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details')
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchLead = useCallback(async () => {
    try {
      const [leadRes, actRes] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch(`/api/leads/${id}/activities`),
      ])
      const [leadData, actData] = await Promise.all([leadRes.json(), actRes.json()])
      if (leadData.success) {
        setLead(leadData.data)
        setNotes(leadData.data.notes || '')
      }
      if (actData.success) setActivities(actData.data)
    } catch {
      toast.error('Failed to load lead details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchLead() }, [fetchLead])

  const updateStatus = async (status: string) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Status updated to ${status}`)
        setLead(data.data)
        fetchLead()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const saveNotes = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Notes saved')
        setLead(data.data)
        setShowNotes(false)
        fetchLead()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  const handleSetFollowUp = async () => {
    if (!followUpDate) return
    setSaving(true)
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
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="agent">
        <div className="flex justify-center py-20">
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      </DashboardLayout>
    )
  }

  if (!lead) {
    return (
      <DashboardLayout requiredRole="agent">
        <div className="text-center py-20">
          <p className="text-gray-500">Lead not found or not assigned to you</p>
          <button onClick={() => router.push('/dashboard/agent/leads')} className="btn-primary mt-4">Back</button>
        </div>
      </DashboardLayout>
    )
  }

  const overdue = isOverdue(lead.followUpDate)

  return (
    <DashboardLayout requiredRole="agent">
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="page-title">{lead.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={getPriorityClass(lead.priority)}>{lead.priority}</span>
                <span className={getStatusClass(lead.status)}>{lead.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={getWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium">
              <MessageCircle size={16} /> WhatsApp
            </a>
            <button onClick={() => setShowFollowUp(true)} className="btn-secondary text-sm flex items-center gap-2">
              <Clock size={16} /> Follow-up
            </button>
            <button onClick={() => setShowNotes(true)} className="btn-secondary text-sm">Notes</button>
          </div>
        </div>

        {/* Overdue Alert */}
        {overdue && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-red-700 text-sm font-medium">
              Follow-up overdue since {formatDate(lead.followUpDate!)} — call now!
            </p>
            <a href={`tel:${lead.phone}`} className="ml-auto flex items-center gap-1.5 text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
              <Phone size={14} /> Call Now
            </a>
          </div>
        )}

        {/* Status Update */}
        <div className="card">
          <h2 className="section-title mb-3">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={lead.status === status || updatingStatus}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                  lead.status === status
                    ? 'bg-crm-purple text-white cursor-default'
                    : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-crm-purple'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          {(['details', 'activity'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('pb-3 text-sm font-semibold capitalize border-b-2 transition-colors',
                activeTab === tab ? 'text-crm-purple border-crm-purple' : 'text-gray-400 border-transparent hover:text-crm-navy')}>
              {tab === 'activity' ? `Activity (${activities.length})` : 'Details'}
            </button>
          ))}
        </div>

        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <h2 className="section-title mb-4">Contact Information</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Phone size={16} className="text-crm-purple" />
                    <div><p className="text-xs text-gray-500">Phone</p><p className="font-semibold text-sm">{lead.phone}</p></div>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Mail size={16} className="text-crm-purple" />
                      <div><p className="text-xs text-gray-500">Email</p><p className="font-semibold text-sm truncate">{lead.email}</p></div>
                    </div>
                  )}
                  {lead.location && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <MapPin size={16} className="text-crm-purple" />
                      <div><p className="text-xs text-gray-500">Location</p><p className="font-semibold text-sm">{lead.location}</p></div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Calendar size={16} className="text-crm-purple" />
                    <div><p className="text-xs text-gray-500">Added</p><p className="font-semibold text-sm">{formatDate(lead.createdAt)}</p></div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="section-title mb-4">Property Interest</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Type', value: lead.propertyInterest },
                    { label: 'Budget', value: formatBudget(lead.budget) },
                    { label: 'Source', value: lead.source },
                    { label: 'Score', value: `${lead.score}/100` },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <p className="font-semibold text-crm-navy">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="section-title">Notes</h2>
                  <button onClick={() => setShowNotes(true)} className="text-xs text-crm-purple hover:text-crm-pink font-medium">Edit →</button>
                </div>
                {lead.notes ? (
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{lead.notes}</p>
                ) : (
                  <p className="text-gray-400 text-sm">No notes yet. Click Edit to add notes.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h2 className="section-title mb-3">Follow-up</h2>
                {lead.followUpDate ? (
                  <div className={cn('p-3 rounded-lg mb-3', overdue ? 'bg-red-50' : 'bg-blue-50')}>
                    <div className="flex items-center gap-2">
                      {overdue ? <AlertCircle size={16} className="text-red-500" /> : <Clock size={16} className="text-blue-500" />}
                      <p className={cn('font-semibold text-sm', overdue ? 'text-red-700' : 'text-blue-700')}>
                        {formatDate(lead.followUpDate)}
                      </p>
                    </div>
                    {overdue && <p className="text-xs text-red-500 mt-1 font-bold">OVERDUE</p>}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm mb-3">No follow-up scheduled</p>
                )}
                <button onClick={() => setShowFollowUp(true)} className="btn-secondary text-sm w-full">
                  {lead.followUpDate ? 'Update' : 'Set Follow-up'}
                </button>
              </div>

              <div className="card bg-gradient-crm text-white">
                <p className="text-white/80 text-sm font-medium mb-2">Lead Score</p>
                <p className="text-5xl font-black text-crm-pink-light">{lead.score}</p>
                <p className="text-white/60 text-xs mb-3">out of 100</p>
                <div className="bg-white/20 rounded-full h-2">
                  <div className="bg-crm-pink-light h-2 rounded-full" style={{ width: `${lead.score}%` }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="section-title mb-5">Activity Timeline</h2>
            {activities.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No activities yet</p>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-4">
                  {activities.map((activity, i) => (
                    <div key={activity._id} className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-50 border-2 border-white flex items-center justify-center text-xl flex-shrink-0 z-10 shadow-sm">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className={cn('flex-1 p-3 rounded-xl', i === 0 ? 'bg-purple-50 border border-crm-pink-light' : 'bg-gray-50')}>
                        <p className="font-semibold text-crm-navy text-sm">{activity.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{(activity.performedBy as { name: string })?.name || 'System'}</span>
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

      {/* Follow-up Modal */}
      <Modal isOpen={showFollowUp} onClose={() => setShowFollowUp(false)} title="Set Follow-up Date" size="sm">
        <div className="space-y-4">
          <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="input-field" min={new Date().toISOString().slice(0, 10)} />
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setShowFollowUp(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSetFollowUp} disabled={saving || !followUpDate}>
              {saving ? 'Saving...' : 'Set Date'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Notes Modal */}
      <Modal isOpen={showNotes} onClose={() => setShowNotes(false)} title="Update Notes" size="md">
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Add your notes about this lead..."
            className="input-field resize-none"
          />
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setShowNotes(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={saveNotes} disabled={saving}>
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
