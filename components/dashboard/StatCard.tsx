import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  className?: string
  gradient?: boolean
  alert?: boolean
}

export default function StatCard({ title, value, icon, trend, trendUp, className, gradient, alert }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl p-5 shadow-sm flex items-start gap-4 transition-all duration-200 hover:shadow-md',
      gradient ? 'bg-gradient-card text-white' : 'bg-white border border-gray-100',
      alert && !gradient && 'border-red-200 bg-red-50',
      className
    )}>
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
        gradient ? 'bg-white/20' : alert ? 'bg-red-100' : 'bg-purple-50'
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium mb-1', gradient ? 'text-white/80' : alert ? 'text-red-600' : 'text-gray-500')}>{title}</p>
        <p className={cn('text-2xl font-bold', gradient ? 'text-white' : alert ? 'text-red-700' : 'text-crm-navy')}>{value}</p>
        {trend && (
          <p className={cn('text-xs mt-1 font-medium', trendUp ? 'text-green-500' : 'text-red-400')}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
    </div>
  )
}
