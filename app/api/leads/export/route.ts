import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Lead from '@/models/Lead'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { unauthorizedResponse, forbiddenResponse, errorResponse } from '@/lib/apiResponse'
import * as XLSX from 'xlsx'

function formatBudget(budget: number): string {
  if (budget >= 10_000_000) return `PKR ${(budget / 1_000_000).toFixed(1)}M`
  if (budget >= 100_000) return `PKR ${(budget / 100_000).toFixed(1)}L`
  return `PKR ${budget.toLocaleString()}`
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return unauthorizedResponse()
    const user = verifyToken(token)
    if (!user) return unauthorizedResponse()
    if (user.role !== 'admin') return forbiddenResponse('Admin access required')

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'

    await connectDB()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {}
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    if (status) query.status = status
    if (priority) query.priority = priority

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    const rows = leads.map((lead, i) => ({
      '#': i + 1,
      Name: lead.name,
      Phone: lead.phone,
      Email: lead.email || '',
      'Property Interest': lead.propertyInterest,
      Location: lead.location || '',
      Budget: formatBudget(lead.budget),
      'Budget (Raw PKR)': lead.budget,
      Priority: lead.priority,
      Score: lead.score,
      Status: lead.status,
      Source: lead.source,
      'Assigned Agent': (lead.assignedTo as { name: string } | null)?.name || 'Unassigned',
      'Follow-up Date': lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString('en-PK') : '',
      'Last Activity': new Date(lead.lastActivityAt).toLocaleDateString('en-PK'),
      Notes: lead.notes || '',
      'Created At': new Date(lead.createdAt).toLocaleDateString('en-PK'),
    }))

    if (format === 'excel') {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)

      // Column widths
      ws['!cols'] = [
        { wch: 4 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 18 },
        { wch: 18 }, { wch: 15 }, { wch: 16 }, { wch: 10 }, { wch: 8 },
        { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
        { wch: 30 }, { wch: 14 },
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Leads')

      // Summary sheet
      const summary = [
        { Metric: 'Total Leads', Value: leads.length },
        { Metric: 'High Priority', Value: leads.filter(l => l.priority === 'High').length },
        { Metric: 'Medium Priority', Value: leads.filter(l => l.priority === 'Medium').length },
        { Metric: 'Low Priority', Value: leads.filter(l => l.priority === 'Low').length },
        { Metric: 'New', Value: leads.filter(l => l.status === 'New').length },
        { Metric: 'Contacted', Value: leads.filter(l => l.status === 'Contacted').length },
        { Metric: 'In Progress', Value: leads.filter(l => l.status === 'In Progress').length },
        { Metric: 'Closed', Value: leads.filter(l => l.status === 'Closed').length },
        { Metric: 'Lost', Value: leads.filter(l => l.status === 'Lost').length },
        { Metric: 'Export Date', Value: new Date().toLocaleDateString('en-PK') },
      ]
      const ws2 = XLSX.utils.json_to_sheet(summary)
      ws2['!cols'] = [{ wch: 20 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, ws2, 'Summary')

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
      const filename = `PropertyCRM-Leads-${new Date().toISOString().slice(0, 10)}.xlsx`

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return errorResponse('Invalid format. Use ?format=excel', 400)
  } catch (error) {
    console.error('[API/leads/export]', error)
    return errorResponse('Export failed', 500)
  }
}
