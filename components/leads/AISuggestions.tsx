'use client'
import { useState, useEffect } from 'react'
import { Sparkles, Phone, MessageCircle, Mail, Building2, Users, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AISuggestion } from '@/lib/aiSuggestions'

interface AISuggestionsProps {
  leadId: string
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  call: <Phone size={14} />,
  whatsapp: <MessageCircle size={14} />,
  email: <Mail size={14} />,
  'site-visit': <Building2 size={14} />,
  meeting: <Users size={14} />,
}

const CHANNEL_LABELS: Record<string, string> = {
  call: 'Phone Call',
  whatsapp: 'WhatsApp',
  email: 'Email',
  'site-visit': 'Site Visit',
  meeting: 'In-Person Meeting',
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-50 border-red-200',
  high: 'bg-orange-50 border-orange-200',
  medium: 'bg-purple-50 border-purple-200',
  low: 'bg-gray-50 border-gray-200',
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-crm-purple text-white',
  low: 'bg-gray-400 text-white',
}

interface SuggestionsData {
  suggestions: AISuggestion[]
  urgency: { score: number; label: string; color: string }
}

export default function AISuggestions({ leadId }: AISuggestionsProps) {
  const [data, setData] = useState<SuggestionsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/suggestions`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSuggestions() }, [leadId])

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-crm-pink animate-pulse" />
          <h2 className="section-title">AI Follow-up Suggestions</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.suggestions.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-crm-pink" />
          <h2 className="section-title">AI Follow-up Suggestions</h2>
        </div>
        <p className="text-gray-400 text-sm text-center py-4">No suggestions — lead is up to date.</p>
      </div>
    )
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-card flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <h2 className="section-title">AI Follow-up Suggestions</h2>
        </div>
        <button
          onClick={fetchSuggestions}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-crm-purple transition-colors"
          title="Refresh suggestions"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Urgency meter */}
      {data.urgency && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-crm-pink-light/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-crm-navy">Follow-up Urgency</span>
            <span className="text-xs font-bold" style={{ color: data.urgency.color }}>{data.urgency.label}</span>
          </div>
          <div className="bg-white/60 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${data.urgency.score}%`, background: data.urgency.color }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{data.urgency.score}/100</p>
        </div>
      )}

      {/* Suggestions */}
      <div className="space-y-3">
        {data.suggestions.map((s, i) => (
          <div
            key={i}
            className={cn('rounded-xl border p-3 transition-all duration-200 hover:shadow-sm', PRIORITY_STYLES[s.priority])}
          >
            <div className="flex items-start gap-3">
              <div className="text-xl flex-shrink-0 mt-0.5">{s.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide', PRIORITY_BADGE[s.priority])}>
                    {s.priority}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
                    {CHANNEL_ICONS[s.channel]}
                    {CHANNEL_LABELS[s.channel]}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">📅 {s.suggestedDate}</span>
                </div>
                <p className="font-semibold text-crm-navy text-sm">{s.action}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
        <Sparkles size={10} /> AI-powered suggestions based on lead data, priority & activity
      </p>
    </div>
  )
}
