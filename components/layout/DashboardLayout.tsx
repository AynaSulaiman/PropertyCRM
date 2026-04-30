'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Menu, X } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'agent'
}

export default function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Socket.io for real-time updates
  useSocket({
    userId: user?.id,
    role: user?.role,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    if (!loading && user && requiredRole && user.role !== requiredRole) {
      router.push(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent')
    }
  }, [user, loading, router, requiredRole])

  if (loading) {
    return <LoadingSpinner fullPage size="lg" text="Loading PropertyCRM..." />
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-crm-navy/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar user={user} onLogout={logout} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-crm-navy to-crm-purple border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white p-1.5 rounded-lg hover:bg-white/10"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <h1 className="text-white font-bold">PropertyCRM</h1>
        </div>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
