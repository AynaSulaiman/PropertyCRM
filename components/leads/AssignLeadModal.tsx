'use client'
import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import type { User, Lead } from '@/types'

interface AssignLeadModalProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
  onSuccess: (updatedLead: Lead) => void
}

export default function AssignLeadModal({ isOpen, onClose, lead, onSuccess }: AssignLeadModalProps) {
  const [agents, setAgents] = useState<User[]>([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetch('/api/agents')
        .then((r) => r.json())
        .then((d) => { if (d.success) setAgents(d.data) })
        .catch(() => toast.error('Failed to load agents'))
    }
  }, [isOpen])

  useEffect(() => {
    if (lead?.assignedTo) {
      setSelectedAgent((lead.assignedTo as User).id || '')
    } else {
      setSelectedAgent('')
    }
  }, [lead])

  const handleAssign = async () => {
    if (!selectedAgent || !lead) {
      toast.error('Please select an agent')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${lead._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Lead assigned successfully')
        onSuccess(data.data)
        onClose()
      } else {
        toast.error(data.message || 'Assignment failed')
      }
    } catch {
      toast.error('Failed to assign lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Lead to Agent" size="sm">
      {lead && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm font-semibold text-crm-navy">{lead.name}</p>
            <p className="text-xs text-gray-500">{lead.propertyInterest} · {lead.phone}</p>
          </div>

          <div>
            <label className="label">Select Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="input-field"
            >
              <option value="">-- Choose an agent --</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({(agent.stats?.total || 0)} leads)
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose} disabled={loading}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleAssign} disabled={loading || !selectedAgent}>
              {loading ? 'Assigning...' : lead.assignedTo ? 'Reassign' : 'Assign'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
