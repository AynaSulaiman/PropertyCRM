'use client'
import { useState, useEffect } from 'react'

interface AnalyticsData {
  overview: {
    totalLeads: number
    totalAgents: number
    closedLeads: number
    conversionRate: number
    newLeadsToday: number
    overdueFollowups: number
    staleLeads: number
  }
  statusDistribution: { name: string; value: number }[]
  priorityDistribution: { name: string; value: number }[]
  agentPerformance: {
    agentName: string
    total: number
    closed: number
    highPriority: number
  }[]
}

export default function ReportPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { if (d.success) setAnalytics(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const handlePrint = () => window.print()

  const FEATURES = [
    { cat: 'Authentication', items: ['JWT tokens in httpOnly cookies', 'bcrypt password hashing (salt rounds=12)', 'Signup & Login flows', 'Session validation on every request'] },
    { cat: 'Role-Based Access Control', items: ['Admin: full system access', 'Agent: assigned leads only', 'Middleware route protection', 'API-level role enforcement'] },
    { cat: 'Lead Management (CRUD)', items: ['Create leads with full schema', 'View with pagination & filtering', 'Update with activity tracking', 'Delete with cascade (activity logs)'] },
    { cat: 'Lead Scoring System', items: ['Auto-scored on creation (Mongoose pre-save)', 'Budget >20M → High (score 90–100)', 'Budget 10–20M → Medium (50–90)', 'Budget <10M → Low (0–50)'] },
    { cat: 'Real-time Updates', items: ['Socket.io bidirectional WebSocket', 'Role-based rooms: admin, user_<id>', 'Notifications: lead created/assigned/deleted', 'Fallback to polling if WS fails'] },
    { cat: 'Analytics Dashboard', items: ['Pie charts: status & priority distribution', 'Bar chart: lead sources', 'Area chart: 30-day trend', 'Agent performance table with conversion rates'] },
    { cat: 'WhatsApp + Email', items: ['Click-to-chat: wa.me/<countrycode><number>', 'Email on new lead (admin notification)', 'Email on assignment (agent notification)', 'HTML email templates with branding'] },
    { cat: 'Activity Timeline', items: ['Logs: created, assigned, status update, notes', 'Chronological timeline per lead', 'Populated with performer name & role', 'Timestamps in readable format'] },
    { cat: 'Smart Follow-up System', items: ['Set follow-up dates per lead', 'Overdue detection (followUpDate < now)', 'Stale detection (no activity 7+ days)', 'Red alerts on both dashboards'] },
    { cat: 'AI Follow-up Suggestions', items: ['Rule-based engine with 12+ smart rules', 'Urgency score (0–100) per lead', 'Channel recommendation (call/WA/email/visit)', 'Source-aware, priority-aware, status-aware'] },
    { cat: 'Export Features', items: ['CSV export (client-side)', 'Excel (.xlsx) with summary sheet', 'PDF export with branded header/footer', 'Filtered exports by status/priority'] },
    { cat: 'Middleware', items: ['Auth: jose JWT (Edge Runtime compatible)', 'Rate limit: 500/min admin, 50/min agent', 'Validation in every API route', 'x-user-* headers forwarded to API'] },
  ]

  const TECH = [
    { name: 'Next.js 14', role: 'App Router, SSR, API Routes' },
    { name: 'MongoDB + Mongoose', role: 'Database with pre-save hooks' },
    { name: 'JWT + bcryptjs', role: 'Auth tokens + password hashing' },
    { name: 'jose', role: 'Edge-compatible JWT verification' },
    { name: 'Socket.io', role: 'Real-time bidirectional events' },
    { name: 'Nodemailer', role: 'Email notifications (SMTP)' },
    { name: 'Tailwind CSS', role: 'Utility-first responsive styling' },
    { name: 'Recharts', role: 'Analytics charts' },
    { name: 'xlsx', role: 'Excel export' },
    { name: 'jsPDF + autoTable', role: 'PDF export' },
  ]

  return (
    <div className="min-h-screen bg-white font-sans" id="report-root">
      {/* Print button - hidden on print */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg hover:opacity-90 transition text-sm"
        >
          🖨️ Print / Save as PDF
        </button>
        <a href="/dashboard/admin" className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition">
          ← Dashboard
        </a>
      </div>

      <div className="max-w-5xl mx-auto p-8 print:p-6">

        {/* Cover Header */}
        <div className="rounded-2xl overflow-hidden mb-8 print:rounded-none" style={{ background: 'linear-gradient(135deg, #39375B 0%, #745C97 50%, #DC6ACF 100%)' }}>
          <div className="p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🏠</div>
              <div>
                <h1 className="text-3xl font-black">PropertyCRM System</h1>
                <p className="text-pink-200 text-sm">Web Development Assignment 3 — PDF Submission Report</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs mb-1">Student</p>
                <p className="text-white font-bold">i221605@nu.edu.pk</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs mb-1">Tech Stack</p>
                <p className="text-white font-bold text-sm">Next.js 14 + MongoDB + Socket.io</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs mb-1">Report Date</p>
                <p className="text-white font-bold">{new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <section className="mb-8">
          <h2 className="text-xl font-black text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-sm flex items-center justify-center font-bold">1</span>
            System Overview
          </h2>
          <p className="text-gray-600 leading-relaxed text-sm border-l-4 border-purple-300 pl-4 bg-purple-50 py-3 rounded-r-xl">
            PropertyCRM is a full-stack CRM system designed for property dealers in Pakistan. It manages leads from multiple
            sources (Facebook Ads, Walk-in, Website, Referral, Phone Call), assigns them to agents, tracks their progress
            through a complete sales pipeline, and provides real-time analytics to administrators. The system uses rule-based
            AI to generate intelligent follow-up suggestions, Socket.io for live updates, and a complete audit trail for every action.
          </p>
        </section>

        {/* Live Stats */}
        {analytics && (
          <section className="mb-8">
            <h2 className="text-xl font-black text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-sm flex items-center justify-center font-bold">2</span>
              Live System Statistics
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total Leads', value: analytics.overview.totalLeads, color: '#39375B' },
                { label: 'Active Agents', value: analytics.overview.totalAgents, color: '#745C97' },
                { label: 'Deals Closed', value: analytics.overview.closedLeads, color: '#10b981' },
                { label: 'Conversion Rate', value: `${analytics.overview.conversionRate}%`, color: '#DC6ACF' },
              ].map(s => (
                <div key={s.label} className="border-2 rounded-xl p-4 text-center" style={{ borderColor: s.color + '40', background: s.color + '08' }}>
                  <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1 font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: 'New Leads Today', value: analytics.overview.newLeadsToday },
                { label: 'Overdue Follow-ups', value: analytics.overview.overdueFollowups },
                { label: 'Stale Leads (7d+)', value: analytics.overview.staleLeads },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-700">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tech Stack */}
        <section className="mb-8">
          <h2 className="text-xl font-black text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-sm flex items-center justify-center font-bold">3</span>
            Technology Stack
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {TECH.map(t => (
              <div key={t.name} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50">
                <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                <div>
                  <span className="font-bold text-sm text-gray-800">{t.name}</span>
                  <span className="text-gray-400 text-xs ml-2">— {t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Implemented */}
        <section className="mb-8">
          <h2 className="text-xl font-black text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-sm flex items-center justify-center font-bold">4</span>
            Features Implemented (All 120 Marks + Bonus)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f.cat} className="border border-gray-100 rounded-xl p-4 bg-gradient-to-br from-white to-purple-50/30">
                <p className="font-bold text-sm text-purple-700 mb-2">{f.cat}</p>
                <ul className="space-y-1">
                  {f.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-8">
          <h2 className="text-xl font-black text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-sm flex items-center justify-center font-bold">5</span>
            Architecture &amp; Auth Flow
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs leading-relaxed">
              <p className="text-gray-500 mb-2"># Request Flow</p>
              <p>Browser</p>
              <p className="ml-3">→ middleware.ts (jose, Edge)</p>
              <p className="ml-6">→ Route Protection</p>
              <p className="ml-6">→ Rate Limiting</p>
              <p className="ml-3">→ Next.js App Router</p>
              <p className="ml-6">→ /app/api/* (Node.js)</p>
              <p className="ml-6">→ /app/dashboard/*</p>
              <p className="ml-3">→ Socket.io (same server)</p>
              <p className="ml-3">→ MongoDB :27017</p>
            </div>
            <div className="bg-gray-900 text-blue-400 rounded-xl p-4 font-mono text-xs leading-relaxed">
              <p className="text-gray-500 mb-2"># Auth Flow</p>
              <p>POST /api/auth/login</p>
              <p className="ml-3 text-yellow-400">bcrypt.compare(pass, hash)</p>
              <p className="ml-3 text-green-400">jwt.sign(&#123;userId, role&#125;)</p>
              <p className="ml-3 text-pink-400">Set-Cookie: crm_token</p>
              <p className="ml-6 text-gray-500">httpOnly; SameSite=Strict</p>
              <p className="mt-2">Every Request:</p>
              <p className="ml-3 text-yellow-400">jose.jwtVerify(token)</p>
              <p className="ml-3 text-green-400">→ role check → allow/deny</p>
            </div>
          </div>
        </section>

        {/* Database Design */}
        <section className="mb-8">
          <h2 className="text-xl font-black text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-sm flex items-center justify-center font-bold">6</span>
            Database Design
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'User', fields: ['name: String', 'email: String (unique)', 'password: String (hashed)', 'role: admin | agent', 'phone: String', 'isActive: Boolean'] },
              { name: 'Lead', fields: ['name, phone, email', 'propertyInterest, location', 'budget: Number', 'status: New|Contacted|…', 'priority: High|Med|Low (auto)', 'score: Number (auto 0–100)', 'assignedTo: ref:User', 'source, followUpDate', 'lastActivityAt'] },
              { name: 'Activity', fields: ['leadId: ref:Lead', 'action: created|assigned|…', 'performedBy: ref:User', 'details: String', 'metadata: Mixed', 'createdAt: Date'] },
            ].map(m => (
              <div key={m.name} className="border-2 border-purple-100 rounded-xl p-4">
                <p className="font-black text-purple-700 text-sm mb-2">📦 {m.name}</p>
                {m.fields.map(f => (
                  <p key={f} className="text-xs text-gray-500 font-mono py-0.5 border-b border-gray-50">{f}</p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Agent Performance */}
        {analytics && analytics.agentPerformance.filter(a => a.agentName).length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-black text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-sm flex items-center justify-center font-bold">7</span>
              Agent Performance (Live Data)
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr style={{ background: '#39375B' }}>
                  {['Agent', 'Total Leads', 'Closed', 'High Priority', 'Conversion Rate'].map(h => (
                    <th key={h} className="text-white text-left py-2 px-4 text-xs font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.agentPerformance.filter(a => a.agentName).map((a, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-purple-50/40'}>
                    <td className="py-2 px-4 font-semibold text-gray-800 text-xs">{a.agentName}</td>
                    <td className="py-2 px-4 text-xs text-center">{a.total}</td>
                    <td className="py-2 px-4 text-xs text-center text-green-600 font-bold">{a.closed}</td>
                    <td className="py-2 px-4 text-xs text-center text-pink-600 font-bold">{a.highPriority}</td>
                    <td className="py-2 px-4 text-xs text-center font-bold" style={{ color: '#745C97' }}>
                      {a.total > 0 ? Math.round((a.closed / a.total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Bonus Features Summary */}
        <section className="mb-8">
          <h2 className="text-xl font-black text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-pink-500 text-white text-sm flex items-center justify-center font-bold">★</span>
            Bonus Features Implemented
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🤖', title: 'AI Follow-up Suggestions', desc: '12+ rule-based rules analyzing priority, source, status, stale days, budget, and property type to generate ranked, channel-specific action recommendations with urgency scoring.' },
              { icon: '📊', title: 'Export to Excel (.xlsx)', desc: 'Server-side export via /api/leads/export using the xlsx library. Generates a formatted workbook with Leads sheet + Summary sheet showing distribution metrics.' },
              { icon: '📄', title: 'Export to PDF', desc: 'Client-side PDF generation using jsPDF + autoTable with branded header (gradient matching app palette), colored priority/status cells, and per-page footers.' },
              { icon: '🔍', title: 'Advanced Filtering & Search', desc: 'Multi-field search (name, phone, email, location) with server-side query building. Filters by status, priority, source with debounced input and sort by score/budget/date.' },
              { icon: '📜', title: 'Activity Logs (Audit Trail)', desc: 'Every action is logged: creation, assignment, reassignment, status change, notes edit, follow-up set, budget change. Timeline UI with icons, performer, and timestamps.' },
              { icon: '📋', title: 'PDF Submission Report', desc: 'This very page — a dynamically generated report with live stats, full feature checklist, architecture diagrams, database schema, and agent performance table.' },
            ].map(b => (
              <div key={b.title} className="flex gap-3 p-4 rounded-xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30">
                <span className="text-2xl flex-shrink-0">{b.icon}</span>
                <div>
                  <p className="font-bold text-sm text-gray-800 mb-1">{b.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="border-t-2 border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-400">PropertyCRM — Web Development Assignment 3 · Built with Next.js 14, MongoDB, Socket.io, Tailwind CSS</p>
          <p className="text-xs text-gray-300 mt-1">i221605@nu.edu.pk · {new Date().getFullYear()}</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>
    </div>
  )
}
