'use client'
import Link from 'next/link'
import { Phone, MessageCircle, Calendar, MapPin, Clock, AlertCircle } from 'lucide-react'
import { formatBudget, formatDate, getWhatsAppUrl, getPriorityClass, getStatusClass, isOverdue } from '@/lib/utils'
import type { Lead } from '@/types'
import { cn } from '@/lib/utils'

interface LeadCardProps {
  lead: Lead
  href: string
  onAssign?: () => void
  showAgent?: boolean
}

export default function LeadCard({ lead, href, onAssign, showAgent }: LeadCardProps) {
  const overdue = isOverdue(lead.followUpDate)
  const whatsappUrl = getWhatsAppUrl(lead.phone)

  return (
    <div className={cn(
      'card-hover relative overflow-hidden transition-all duration-200 animate-slide-up',
      lead.priority === 'High' && 'priority-high-pulse border-crm-pink/30',
    )}>
      {/* Priority indicator */}
      <div className={cn(
        'absolute top-0 left-0 w-1 h-full rounded-l-xl',
        lead.priority === 'High' ? 'bg-crm-pink' :
        lead.priority === 'Medium' ? 'bg-crm-purple' : 'bg-crm-silver'
      )} />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link href={href} className="font-bold text-crm-navy hover:text-crm-purple transition-colors truncate block">
              {lead.name}
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={getPriorityClass(lead.priority)}>{lead.priority}</span>
              <span className={getStatusClass(lead.status)}>{lead.status}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <p className="font-bold text-crm-purple text-sm">{formatBudget(lead.budget)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Score: {lead.score}</p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Phone size={13} className="text-crm-purple flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-crm-purple flex-shrink-0" />
            <span className="truncate">{lead.location || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-crm-purple flex-shrink-0" />
            <span>{formatDate(lead.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs bg-purple-50 text-crm-purple px-2 py-0.5 rounded-full font-medium truncate">
              {lead.propertyInterest}
            </span>
          </div>
        </div>

        {/* Source badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {lead.source}
          </span>
          {showAgent && lead.assignedTo && (
            <span className="text-xs bg-purple-50 text-crm-purple px-2 py-0.5 rounded-full font-medium">
              👤 {(lead.assignedTo as { name: string }).name}
            </span>
          )}
          {showAgent && !lead.assignedTo && (
            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
              ⚠ Unassigned
            </span>
          )}
        </div>

        {/* Follow-up alert */}
        {lead.followUpDate && (
          <div className={cn(
            'flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 mb-3',
            overdue ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
          )}>
            {overdue ? <AlertCircle size={12} /> : <Clock size={12} />}
            <span>
              {overdue ? 'Overdue: ' : 'Follow-up: '}
              {formatDate(lead.followUpDate)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Link href={href} className="btn-secondary text-xs px-3 py-1.5 flex-1 text-center">
            View Details
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <MessageCircle size={12} />
            WhatsApp
          </a>
          {onAssign && (
            <button
              onClick={onAssign}
              className="text-xs px-3 py-1.5 bg-crm-purple/10 text-crm-purple rounded-lg hover:bg-crm-purple hover:text-white transition-colors font-medium"
            >
              Assign
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
