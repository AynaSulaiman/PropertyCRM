import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  fullPage?: boolean
}

export default function LoadingSpinner({ size = 'md', className, text, fullPage }: LoadingSpinnerProps) {
  const sizes = { sm: 16, md: 24, lg: 48 }
  const px = sizes[size]

  const spinner = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className="rounded-full border-4 border-crm-silver border-t-crm-purple animate-spin"
        style={{ width: px, height: px }}
      />
      {text && <p className="text-crm-purple font-medium text-sm">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-crm-navy via-crm-purple to-crm-pink">
        {spinner}
      </div>
    )
  }

  return spinner
}
