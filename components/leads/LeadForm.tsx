'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Lead } from '@/types'

interface LeadFormProps {
  onSuccess: (lead: Lead) => void
  onCancel: () => void
  initialData?: Partial<Lead>
  isEdit?: boolean
}

const PROPERTY_INTERESTS = ['Residential', 'Commercial', 'Plot', 'Farm House', 'Apartment', 'Office']
const SOURCES = ['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Phone Call', 'Other']
const STATUSES = ['New', 'Contacted', 'In Progress', 'Closed', 'Lost']

export default function LeadForm({ onSuccess, onCancel, initialData, isEdit }: LeadFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    propertyInterest: initialData?.propertyInterest || 'Residential',
    location: initialData?.location || '',
    budget: initialData?.budget?.toString() || '',
    status: initialData?.status || 'New',
    source: initialData?.source || 'Other',
    notes: initialData?.notes || '',
    followUpDate: initialData?.followUpDate ? new Date(initialData.followUpDate).toISOString().slice(0, 10) : '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.propertyInterest || !form.budget) {
      toast.error('Please fill all required fields')
      return
    }
    const budgetNum = parseFloat(form.budget)
    if (isNaN(budgetNum) || budgetNum < 0) {
      toast.error('Please enter a valid budget amount')
      return
    }

    setLoading(true)
    try {
      const url = isEdit ? `/api/leads/${initialData?._id}` : '/api/leads'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          budget: budgetNum,
          followUpDate: form.followUpDate || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(isEdit ? 'Lead updated successfully' : 'Lead created successfully')
        onSuccess(data.data)
      } else {
        toast.error(data.message || 'Operation failed')
      }
    } catch {
      toast.error('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name <span className="text-red-500">*</span></label>
          <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Client name" className="input-field" required />
        </div>
        <div>
          <label className="label">Phone <span className="text-red-500">*</span></label>
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="923001234567" className="input-field" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="optional@email.com" className="input-field" />
        </div>
        <div>
          <label className="label">Location</label>
          <input name="location" type="text" value={form.location} onChange={handleChange} placeholder="DHA, Bahria Town..." className="input-field" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Property Interest <span className="text-red-500">*</span></label>
          <select name="propertyInterest" value={form.propertyInterest} onChange={handleChange} className="input-field">
            {PROPERTY_INTERESTS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">
            Budget (PKR) <span className="text-red-500">*</span>
            <span className="text-xs text-gray-400 font-normal ml-1">→ &gt;20M=High, 10-20M=Med</span>
          </label>
          <input name="budget" type="number" value={form.budget} onChange={handleChange} placeholder="e.g. 25000000" className="input-field" min="0" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Lead Source</label>
          <select name="source" value={form.source} onChange={handleChange} className="input-field">
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="input-field">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Follow-up Date</label>
        <input name="followUpDate" type="date" value={form.followUpDate} onChange={handleChange} className="input-field" />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Any additional notes about the lead..." className="input-field resize-none" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
        </button>
      </div>
    </form>
  )
}
