'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Home, Lock, Mail, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@propertycrm.com', password: 'admin123', role: 'admin' },
  { label: 'Agent Ahmed', email: 'ahmed@propertycrm.com', password: 'agent123', role: 'agent' },
  { label: 'Agent Sara', email: 'sara@propertycrm.com', password: 'agent123', role: 'agent' },
  { label: 'Agent Bilal', email: 'bilal@propertycrm.com', password: 'agent123', role: 'agent' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Welcome back, ${data.data.user.name}!`)
        router.push(data.data.user.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent')
      } else {
        toast.error(data.message || 'Login failed')
      }
    } catch {
      toast.error('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email)
    setPassword(account.password)
    toast('Credentials filled! Click Sign In', { icon: '👆' })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-crm flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-crm-pink rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Home className="text-white" size={26} />
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl">PropertyCRM</h1>
              <p className="text-crm-pink-light text-sm">Real Estate Suite</p>
            </div>
          </div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Manage Leads,<br />
            <span className="text-crm-pink-light">Close Deals Faster</span>
          </h2>
          <p className="text-white/70 text-lg">
            The complete CRM solution for Pakistan&apos;s property dealers. Track, assign, and convert leads with ease.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-4">
          {[
            { label: 'Active Leads', value: '500+', icon: '🏠' },
            { label: 'Conversion Rate', value: '68%', icon: '📈' },
            { label: 'Agents', value: '50+', icon: '👥' },
            { label: 'Deals Closed', value: '2K+', icon: '✅' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className="text-white font-bold text-xl">{stat.value}</p>
              <p className="text-white/60 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-crm rounded-xl flex items-center justify-center">
              <Home className="text-white" size={22} />
            </div>
            <h1 className="text-crm-navy font-bold text-xl">PropertyCRM</h1>
          </div>

          <h2 className="text-3xl font-bold text-crm-navy mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-field pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderTopColor: 'white' }} />
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-crm-purple font-semibold hover:text-crm-pink transition-colors">
              Create Account
            </Link>
          </div>

          {/* Demo Accounts */}
          <div className="mt-8 p-4 bg-purple-50 rounded-xl border border-crm-silver">
            <p className="text-xs font-semibold text-crm-purple mb-3 uppercase tracking-wide">
              🔑 Demo Accounts (Click to fill)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => quickLogin(account)}
                  className="text-left p-2.5 bg-white rounded-lg border border-crm-silver hover:border-crm-purple hover:bg-purple-50 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${account.role === 'admin' ? 'bg-crm-pink' : 'bg-crm-purple'}`} />
                    <p className="text-xs font-semibold text-crm-navy group-hover:text-crm-purple">{account.label}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{account.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
