import type { Lead } from '@/types'

export interface AISuggestion {
  priority: 'urgent' | 'high' | 'medium' | 'low'
  action: string
  reason: string
  channel: 'whatsapp' | 'call' | 'email' | 'site-visit' | 'meeting'
  suggestedDate: string
  icon: string
}

function daysAgo(date: string | Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

function isOverdue(date?: string | Date | null): boolean {
  return !!date && new Date(date) < new Date()
}

function formatSuggestedDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function generateAISuggestions(lead: Lead): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  const budgetM = lead.budget / 1_000_000
  const staleDays = daysAgo(lead.lastActivityAt)
  const overdue = isOverdue(lead.followUpDate)

  // 1 — Overdue follow-up (always urgent)
  if (overdue && !['Closed', 'Lost'].includes(lead.status)) {
    suggestions.push({
      priority: 'urgent',
      icon: '🚨',
      action: 'Call immediately — follow-up is overdue',
      reason: `Follow-up was scheduled for ${new Date(lead.followUpDate!).toLocaleDateString('en-PK')} and was missed. High risk of losing this lead.`,
      channel: 'call',
      suggestedDate: formatSuggestedDate(0),
    })
  }

  // 2 — New + High priority
  if (lead.status === 'New' && lead.priority === 'High') {
    suggestions.push({
      priority: 'urgent',
      icon: '🔥',
      action: `Call ${lead.name} within 2 hours`,
      reason: `High-value lead (PKR ${budgetM.toFixed(0)}M) that just came in via ${lead.source}. Speed to contact is critical — chances drop 10x after 1 hour.`,
      channel: 'call',
      suggestedDate: formatSuggestedDate(0),
    })
  }

  // 3 — New + Medium priority
  if (lead.status === 'New' && lead.priority === 'Medium') {
    suggestions.push({
      priority: 'high',
      icon: '📱',
      action: 'Send introductory WhatsApp message today',
      reason: `Medium-priority lead. A warm WhatsApp intro with property options builds rapport before a call.`,
      channel: 'whatsapp',
      suggestedDate: formatSuggestedDate(0),
    })
  }

  // 4 — New + Low priority
  if (lead.status === 'New' && lead.priority === 'Low') {
    suggestions.push({
      priority: 'medium',
      icon: '✉️',
      action: 'Send property brochure via WhatsApp',
      reason: `Budget under 10M — nurture with digital content first. Share available plots/apartments in their range.`,
      channel: 'whatsapp',
      suggestedDate: formatSuggestedDate(1),
    })
  }

  // 5 — Contacted + High priority → push for site visit
  if (lead.status === 'Contacted' && lead.priority === 'High') {
    suggestions.push({
      priority: 'high',
      icon: '🏠',
      action: 'Arrange a site visit this week',
      reason: `You have already made contact. The next step for a PKR ${budgetM.toFixed(0)}M lead is to convert interest into a physical visit — conversion rate jumps 3x after a site visit.`,
      channel: 'site-visit',
      suggestedDate: formatSuggestedDate(2),
    })
  }

  // 6 — Contacted + Medium → share more options
  if (lead.status === 'Contacted' && lead.priority === 'Medium') {
    suggestions.push({
      priority: 'medium',
      icon: '📋',
      action: 'Share 2–3 curated property options via WhatsApp',
      reason: `Lead has been contacted. Sending targeted listings keeps them engaged and helps qualify their exact needs.`,
      channel: 'whatsapp',
      suggestedDate: formatSuggestedDate(1),
    })
  }

  // 7 — In Progress + any — push to close
  if (lead.status === 'In Progress') {
    suggestions.push({
      priority: lead.priority === 'High' ? 'urgent' : 'high',
      icon: '🤝',
      action: 'Schedule closing meeting or token payment discussion',
      reason: `Lead is in progress — this is the most critical stage. Delay risks losing to a competitor. Discuss final terms and token amount.`,
      channel: 'meeting',
      suggestedDate: formatSuggestedDate(1),
    })
  }

  // 8 — Stale lead (7+ days no activity, not closed)
  if (staleDays >= 7 && !['Closed', 'Lost'].includes(lead.status)) {
    suggestions.push({
      priority: 'high',
      icon: '⏰',
      action: `Re-engage ${lead.name} — no activity for ${staleDays} days`,
      reason: `Lead has gone cold. Send a re-engagement message referencing new properties matching their interest (${lead.propertyInterest}) and budget range.`,
      channel: lead.priority === 'High' ? 'call' : 'whatsapp',
      suggestedDate: formatSuggestedDate(0),
    })
  }

  // 9 — Source-based suggestions
  if (lead.source === 'Facebook Ads' && lead.status === 'New') {
    suggestions.push({
      priority: 'medium',
      icon: '📲',
      action: 'Start with WhatsApp — Facebook leads prefer messaging',
      reason: `Facebook Ad leads typically respond better to WhatsApp first before a call. Start with a friendly intro message.`,
      channel: 'whatsapp',
      suggestedDate: formatSuggestedDate(0),
    })
  }

  if (lead.source === 'Walk-in' && lead.status === 'New') {
    suggestions.push({
      priority: 'urgent',
      icon: '🏃',
      action: 'Call within 1 hour — walk-in leads are HOT',
      reason: `Walk-in clients showed direct intent. They are the highest converting source. Follow up immediately before they visit a competitor.`,
      channel: 'call',
      suggestedDate: formatSuggestedDate(0),
    })
  }

  if (lead.source === 'Referral') {
    suggestions.push({
      priority: 'high',
      icon: '⭐',
      action: 'Prioritize — referral leads close at 2x the rate',
      reason: `Referral leads have built-in trust. Mention the referrer by name in your first contact. High close probability.`,
      channel: 'call',
      suggestedDate: formatSuggestedDate(0),
    })
  }

  // 10 — Property type based
  if (lead.propertyInterest === 'Commercial' || lead.propertyInterest === 'Office') {
    suggestions.push({
      priority: 'medium',
      icon: '🏢',
      action: 'Prepare a commercial property portfolio before calling',
      reason: `Commercial clients are business decision-makers — come prepared with NOC status, floor plans, rental yield data, and occupancy rates.`,
      channel: 'meeting',
      suggestedDate: formatSuggestedDate(1),
    })
  }

  if (lead.propertyInterest === 'Farm House' && budgetM > 20) {
    suggestions.push({
      priority: 'high',
      icon: '🌿',
      action: 'Arrange exclusive farmhouse tour on weekend',
      reason: `High-budget farmhouse leads prefer exclusive, private viewings. Weekend tours with family have higher conversion. Book a dedicated slot.`,
      channel: 'site-visit',
      suggestedDate: formatSuggestedDate(3),
    })
  }

  // 11 — Very high budget special treatment
  if (budgetM >= 30 && !['Closed', 'Lost'].includes(lead.status)) {
    suggestions.push({
      priority: 'high',
      icon: '💎',
      action: 'Offer VIP service — assign senior agent or manager',
      reason: `Budget of PKR ${budgetM.toFixed(0)}M is premium-tier. This lead deserves a personal meeting with a senior representative, not just a phone call.`,
      channel: 'meeting',
      suggestedDate: formatSuggestedDate(1),
    })
  }

  // Sort by priority: urgent > high > medium > low
  const order = { urgent: 0, high: 1, medium: 2, low: 3 }
  suggestions.sort((a, b) => order[a.priority] - order[b.priority])

  // Return top 4 suggestions max
  return suggestions.slice(0, 4)
}

export function getFollowUpScore(lead: Lead): { score: number; label: string; color: string } {
  let score = lead.score
  const staleDays = daysAgo(lead.lastActivityAt)

  if (isOverdue(lead.followUpDate)) score = Math.min(100, score + 20)
  if (staleDays >= 7) score = Math.min(100, score + 15)
  if (lead.source === 'Walk-in' || lead.source === 'Referral') score = Math.min(100, score + 10)
  if (lead.status === 'In Progress') score = Math.min(100, score + 10)

  if (score >= 80) return { score, label: 'Critical — Act Now', color: '#DC6ACF' }
  if (score >= 60) return { score, label: 'High Urgency', color: '#745C97' }
  if (score >= 40) return { score, label: 'Follow Up Soon', color: '#F5B0CB' }
  return { score, label: 'Low Urgency', color: '#C4BBB8' }
}
