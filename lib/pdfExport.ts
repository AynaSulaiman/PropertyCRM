import type { Lead } from '@/types'

function formatBudget(budget: number): string {
  if (budget >= 10_000_000) return `PKR ${(budget / 1_000_000).toFixed(1)}M`
  if (budget >= 100_000) return `PKR ${(budget / 100_000).toFixed(1)}L`
  return `PKR ${budget.toLocaleString()}`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
}

export async function exportLeadsToPDF(leads: Lead[]): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header gradient simulation
  doc.setFillColor(57, 55, 91)
  doc.rect(0, 0, 297, 22, 'F')
  doc.setFillColor(116, 92, 151)
  doc.rect(100, 0, 97, 22, 'F')
  doc.setFillColor(220, 106, 207)
  doc.rect(200, 0, 97, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PropertyCRM — Leads Export Report', 14, 14)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}  |  Total Leads: ${leads.length}`, 14, 19)

  // Summary boxes
  const statY = 28
  const stats = [
    { label: 'Total', value: leads.length, color: [57, 55, 91] as [number, number, number] },
    { label: 'High Priority', value: leads.filter(l => l.priority === 'High').length, color: [220, 106, 207] as [number, number, number] },
    { label: 'Medium Priority', value: leads.filter(l => l.priority === 'Medium').length, color: [116, 92, 151] as [number, number, number] },
    { label: 'Closed', value: leads.filter(l => l.status === 'Closed').length, color: [16, 185, 129] as [number, number, number] },
    { label: 'Overdue', value: leads.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date() && !['Closed', 'Lost'].includes(l.status)).length, color: [239, 68, 68] as [number, number, number] },
  ]

  stats.forEach((s, i) => {
    const x = 14 + i * 56
    doc.setFillColor(...s.color)
    doc.roundedRect(x, statY, 52, 14, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(String(s.value), x + 26, statY + 8, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(s.label, x + 26, statY + 12, { align: 'center' })
  })

  // Table
  autoTable(doc, {
    startY: statY + 20,
    head: [['#', 'Name', 'Phone', 'Property', 'Budget', 'Priority', 'Status', 'Agent', 'Source', 'Follow-up', 'Created']],
    body: leads.map((l, i) => [
      i + 1,
      l.name,
      l.phone,
      l.propertyInterest,
      formatBudget(l.budget),
      l.priority,
      l.status,
      (l.assignedTo as { name: string } | null)?.name || '—',
      l.source,
      l.followUpDate ? formatDate(l.followUpDate) : '—',
      formatDate(l.createdAt),
    ]),
    headStyles: {
      fillColor: [57, 55, 91],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [39, 39, 42] },
    alternateRowStyles: { fillColor: [248, 247, 255] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const v = data.cell.raw as string
        if (v === 'High') data.cell.styles.textColor = [220, 106, 207]
        else if (v === 'Medium') data.cell.styles.textColor = [116, 92, 151]
      }
      if (data.section === 'body' && data.column.index === 6) {
        const v = data.cell.raw as string
        if (v === 'Closed') data.cell.styles.textColor = [16, 185, 129]
        else if (v === 'Lost') data.cell.styles.textColor = [239, 68, 68]
        else if (v === 'New') data.cell.styles.textColor = [59, 130, 246]
      }
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
      6: { cellWidth: 22 },
      7: { cellWidth: 28 },
      8: { cellWidth: 22 },
      9: { cellWidth: 20 },
      10: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(57, 55, 91)
    doc.rect(0, 200, 297, 10, 'F')
    doc.setTextColor(196, 187, 184)
    doc.setFontSize(7)
    doc.text('PropertyCRM | Confidential Lead Report', 14, 206)
    doc.text(`Page ${i} of ${pageCount}`, 283, 206, { align: 'right' })
  }

  doc.save(`PropertyCRM-Leads-${new Date().toISOString().slice(0, 10)}.pdf`)
}
