'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.role) {
          router.replace(data.data.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent')
        } else {
          router.replace('/login')
        }
      })
      .catch(() => router.replace('/login'))
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-crm">
      <div className="text-center text-white">
        <div className="spinner mx-auto mb-4" style={{ borderTopColor: '#F5B0CB', width: 48, height: 48, borderWidth: 4 }} />
        <p className="text-lg font-semibold">Loading PropertyCRM...</p>
      </div>
    </div>
  )
}
