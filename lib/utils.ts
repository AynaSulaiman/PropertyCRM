import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBudget(budget: number): string {
  if (budget >= 10_000_000) return `PKR ${(budget / 1_000_000).toFixed(1)}M`
  if (budget >= 100_000) return `PKR ${(budget / 100_000).toFixed(1)}L`
  return `PKR ${budget.toLocaleString()}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}

export function isOverdue(date?: string | Date | null): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

export function getWhatsAppUrl(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  // Remove leading + if present (wa.me doesn't need it)
  const normalized = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned
  return `https://wa.me/${normalized}`
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'High': return 'text-crm-pink'
    case 'Medium': return 'text-crm-purple'
    default: return 'text-gray-500'
  }
}

export function getStatusClass(status: string): string {
  switch (status) {
    case 'New': return 'status-new'
    case 'Contacted': return 'status-contacted'
    case 'In Progress': return 'status-in-progress'
    case 'Closed': return 'status-closed'
    case 'Lost': return 'status-lost'
    default: return 'status-new'
  }
}

export function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'High': return 'badge-high'
    case 'Medium': return 'badge-medium'
    default: return 'badge-low'
  }
}

export function getActivityIcon(action: string): string {
  const icons: Record<string, string> = {
    created: '✨',
    status_updated: '🔄',
    assigned: '👤',
    reassigned: '🔀',
    notes_updated: '📝',
    priority_changed: '⚡',
    followup_set: '📅',
    budget_updated: '💰',
    contact_updated: '📞',
    deleted: '🗑️',
  }
  return icons[action] || '📌'
}
