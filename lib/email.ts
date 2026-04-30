import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

interface NewLeadEmailData {
  leadName: string
  leadPhone: string
  leadEmail?: string
  propertyInterest: string
  budget: number
  source: string
  priority: string
  adminEmail: string
}

interface AssignLeadEmailData {
  leadName: string
  leadPhone: string
  propertyInterest: string
  budget: number
  agentName: string
  agentEmail: string
  adminName: string
}

function formatBudget(budget: number): string {
  if (budget >= 10_000_000) {
    return `PKR ${(budget / 1_000_000).toFixed(1)}M`
  }
  return `PKR ${budget.toLocaleString()}`
}

function getPriorityBadge(priority: string): string {
  const colors: Record<string, string> = {
    High: '#DC6ACF',
    Medium: '#745C97',
    Low: '#C4BBB8',
  }
  return `<span style="background:${colors[priority] || '#C4BBB8'};color:white;padding:3px 8px;border-radius:12px;font-size:12px;font-weight:600;">${priority}</span>`
}

const emailBaseStyle = `
  font-family: 'Segoe UI', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(57,55,91,0.15);
`

export async function sendNewLeadEmail(data: NewLeadEmailData): Promise<void> {
  if (!process.env.EMAIL_USER) return

  const html = `
    <div style="${emailBaseStyle}">
      <div style="background: linear-gradient(135deg, #39375B 0%, #745C97 50%, #DC6ACF 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">🏠 New Lead Alert</h1>
        <p style="color: #F5B0CB; margin: 8px 0 0; font-size: 14px;">PropertyCRM System</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="color: #39375B; font-size: 16px; margin-bottom: 24px;">A new lead has been submitted and requires attention.</p>
        <div style="background: #f8f6ff; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #745C97;">
          <h2 style="color: #39375B; margin: 0 0 16px; font-size: 18px;">Lead Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #745C97; font-weight: 600; width: 40%;">Name</td><td style="color: #39375B;">${data.leadName}</td></tr>
            <tr><td style="padding: 6px 0; color: #745C97; font-weight: 600;">Phone</td><td style="color: #39375B;">${data.leadPhone}</td></tr>
            ${data.leadEmail ? `<tr><td style="padding: 6px 0; color: #745C97; font-weight: 600;">Email</td><td style="color: #39375B;">${data.leadEmail}</td></tr>` : ''}
            <tr><td style="padding: 6px 0; color: #745C97; font-weight: 600;">Property Interest</td><td style="color: #39375B;">${data.propertyInterest}</td></tr>
            <tr><td style="padding: 6px 0; color: #745C97; font-weight: 600;">Budget</td><td style="color: #39375B;">${formatBudget(data.budget)}</td></tr>
            <tr><td style="padding: 6px 0; color: #745C97; font-weight: 600;">Source</td><td style="color: #39375B;">${data.source}</td></tr>
            <tr><td style="padding: 6px 0; color: #745C97; font-weight: 600;">Priority</td><td>${getPriorityBadge(data.priority)}</td></tr>
          </table>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/leads" style="background: linear-gradient(135deg, #745C97, #DC6ACF); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View & Assign Lead →</a>
        </div>
      </div>
      <div style="background: #39375B; padding: 16px 24px; text-align: center;">
        <p style="color: #C4BBB8; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} PropertyCRM System. All rights reserved.</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: data.adminEmail,
    subject: `🏠 New ${data.priority} Priority Lead: ${data.leadName}`,
    html,
  })
}

export async function sendLeadAssignmentEmail(data: AssignLeadEmailData): Promise<void> {
  if (!process.env.EMAIL_USER) return

  const html = `
    <div style="${emailBaseStyle}">
      <div style="background: linear-gradient(135deg, #39375B 0%, #745C97 50%, #DC6ACF 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">📋 Lead Assigned to You</h1>
        <p style="color: #F5B0CB; margin: 8px 0 0; font-size: 14px;">PropertyCRM System</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="color: #39375B; font-size: 16px; margin-bottom: 8px;">Hi <strong>${data.agentName}</strong>,</p>
        <p style="color: #39375B; font-size: 16px; margin-bottom: 24px;">You have been assigned a new lead by <strong>${data.adminName}</strong>. Please review the details and make contact as soon as possible.</p>
        <div style="background: #f8f6ff; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #DC6ACF;">
          <h2 style="color: #39375B; margin: 0 0 16px; font-size: 18px;">Your New Lead</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #745C97; font-weight: 600; width: 40%;">Name</td><td style="color: #39375B;">${data.leadName}</td></tr>
            <tr><td style="padding: 6px 0; color: #745C97; font-weight: 600;">Phone</td><td style="color: #39375B;">${data.leadPhone}</td></tr>
            <tr><td style="padding: 6px 0; color: #745C97; font-weight: 600;">Property Interest</td><td style="color: #39375B;">${data.propertyInterest}</td></tr>
            <tr><td style="padding: 6px 0; color: #745C97; font-weight: 600;">Budget</td><td style="color: #39375B;">${formatBudget(data.budget)}</td></tr>
          </table>
        </div>
        <div style="background: #FFF3CD; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">⚡ <strong>Action Required:</strong> Please contact this lead within 24 hours for best conversion rates.</p>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/agent/leads" style="background: linear-gradient(135deg, #745C97, #DC6ACF); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View My Leads →</a>
        </div>
      </div>
      <div style="background: #39375B; padding: 16px 24px; text-align: center;">
        <p style="color: #C4BBB8; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} PropertyCRM System. All rights reserved.</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: data.agentEmail,
    subject: `📋 New Lead Assigned: ${data.leadName}`,
    html,
  })
}
