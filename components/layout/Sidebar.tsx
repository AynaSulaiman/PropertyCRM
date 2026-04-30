'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCircle, TrendingUp, LogOut,
  Building2, Bell, ChevronRight, Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

interface SidebarProps {
  user: User
  onLogout: () => void
  collapsed?: boolean
}

const adminLinks = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/admin/leads', label: 'All Leads', icon: Building2 },
  { href: '/dashboard/admin/agents', label: 'Agents', icon: Users },
]

const agentLinks = [
  { href: '/dashboard/agent', label: 'My Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/agent/leads', label: 'My Leads', icon: Building2 },
]

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const links = user.role === 'admin' ? adminLinks : agentLinks

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-crm-navy to-crm-purple flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Home className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">PropertyCRM</h1>
            <p className="text-crm-pink-light text-xs">Real Estate Suite</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-crm-silver/60 text-xs font-semibold uppercase tracking-wider px-4 mb-3">
          {user.role === 'admin' ? 'Administration' : 'My Workspace'}
        </p>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              isActive(link.href, link.exact) ? 'sidebar-link-active' : 'sidebar-link'
            )}
          >
            <link.icon size={20} />
            <span className="flex-1">{link.label}</span>
            {isActive(link.href, link.exact) && <ChevronRight size={16} className="opacity-70" />}
          </Link>
        ))}

        {user.role === 'admin' && (
          <>
            <p className="text-crm-silver/60 text-xs font-semibold uppercase tracking-wider px-4 mb-3 mt-6">
              Analytics
            </p>
            <Link
              href="/dashboard/admin"
              className={cn(pathname === '/dashboard/admin' ? 'sidebar-link-active' : 'sidebar-link')}
            >
              <TrendingUp size={20} />
              <span className="flex-1">Reports</span>
            </Link>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-crm-pink-light to-crm-pink flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user.name}</p>
            <p className="text-crm-pink-light text-xs capitalize">{user.role}</p>
          </div>
          <Bell size={16} className="text-crm-silver/60 flex-shrink-0" />
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-crm-silver hover:bg-red-500/20 hover:text-white transition-all duration-200 text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
