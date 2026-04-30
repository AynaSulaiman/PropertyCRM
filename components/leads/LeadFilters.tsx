'use client'
import { Search, Filter, X } from 'lucide-react'

interface Filters {
  search: string
  status: string
  priority: string
  source: string
  sortBy: string
  sortOrder: string
}

interface LeadFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  onReset: () => void
}

const STATUS_OPTIONS = ['', 'New', 'Contacted', 'In Progress', 'Closed', 'Lost']
const PRIORITY_OPTIONS = ['', 'High', 'Medium', 'Low']
const SOURCE_OPTIONS = ['', 'Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Phone Call', 'Other']
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'score', label: 'Lead Score' },
  { value: 'budget', label: 'Budget' },
  { value: 'name', label: 'Name' },
]

const hasActiveFilters = (f: Filters) =>
  f.search || f.status || f.priority || f.source

export default function LeadFilters({ filters, onChange, onReset }: LeadFiltersProps) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="card mb-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex-1 min-w-48">
          <label className="label text-xs">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Name, phone, email..."
              value={filters.search}
              onChange={(e) => update('search', e.target.value)}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </div>

        {/* Status */}
        <div className="min-w-36">
          <label className="label text-xs">Status</label>
          <select value={filters.status} onChange={(e) => update('status', e.target.value)} className="input-field py-2 text-sm">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>

        {/* Priority */}
        <div className="min-w-36">
          <label className="label text-xs">Priority</label>
          <select value={filters.priority} onChange={(e) => update('priority', e.target.value)} className="input-field py-2 text-sm">
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
          </select>
        </div>

        {/* Source */}
        <div className="min-w-36">
          <label className="label text-xs">Source</label>
          <select value={filters.source} onChange={(e) => update('source', e.target.value)} className="input-field py-2 text-sm">
            {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All Sources'}</option>)}
          </select>
        </div>

        {/* Sort */}
        <div className="min-w-36">
          <label className="label text-xs">Sort By</label>
          <div className="flex gap-1">
            <select value={filters.sortBy} onChange={(e) => update('sortBy', e.target.value)} className="input-field py-2 text-sm flex-1">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={() => update('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
              className="input-field py-2 px-3 text-sm"
              title="Toggle sort order"
            >
              {filters.sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>

        {/* Reset */}
        {hasActiveFilters(filters) && (
          <button onClick={onReset} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
            <X size={14} />
            Reset
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
          <Filter size={14} />
          <span>Filters applied</span>
        </div>
      </div>
    </div>
  )
}
