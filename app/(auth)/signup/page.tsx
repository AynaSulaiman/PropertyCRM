'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Home, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', role: 'agent' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill all required fields')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Account created! Welcome to PropertyCRM')
        router.push(data.data.user.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent')
      } else {
        toast.error(data.message || 'Registration failed')
      }
    } catch {
      toast.error('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-crm flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-crm-pink rounded-full blur-3xl" />
        </div>
        <div className="relative text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Home className="text-white" size={40} />
          </div>
          <h1 className="text-white font-bold text-3xl mb-4">PropertyCRM</h1>
          <p className="text-white/70 text-lg max-w-xs">
            Join thousands of property dealers managing their leads efficiently
          </p>
          <div className="mt-8 space-y-3 text-left">
            {['Track leads in real-time', 'Assign leads to agents', 'Analytics & insights', 'WhatsApp integration'].map((f) => (
              <div key={f} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                <div className="w-6 h-6 bg-crm-pink rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-crm rounded-xl flex items-center justify-center">
              <Home className="text-white" size={22} />
            </div>
            <h1 className="text-crm-navy font-bold text-xl">PropertyCRM</h1>
          </div>

          <h2 className="text-3xl font-bold text-crm-navy mb-2">Create Account</h2>
          <p className="text-gray-500 mb-8">Start managing your property leads today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Ahmed Raza" className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <label className="label">Email Address <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="03001234567" className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="label">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="input-field">
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="label">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Min 6 characters" className="input-field pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" className="input-field pl-10" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderTopColor: 'white' }} />
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-crm-purple font-semibold hover:text-crm-pink transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
