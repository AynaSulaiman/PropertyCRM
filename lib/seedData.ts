import connectDB from './mongodb'
import User from '../models/User'
import Lead from '../models/Lead'
import Activity from '../models/Activity'
import mongoose from 'mongoose'

const SEED_USERS = [
  {
    name: 'Admin User',
    email: 'admin@propertycrm.com',
    password: 'admin123',
    role: 'admin' as const,
    phone: '03001234567',
  },
  {
    name: 'Ahmed Raza',
    email: 'ahmed@propertycrm.com',
    password: 'agent123',
    role: 'agent' as const,
    phone: '03011234567',
  },
  {
    name: 'Sara Khan',
    email: 'sara@propertycrm.com',
    password: 'agent123',
    role: 'agent' as const,
    phone: '03021234567',
  },
  {
    name: 'Bilal Hassan',
    email: 'bilal@propertycrm.com',
    password: 'agent123',
    role: 'agent' as const,
    phone: '03031234567',
  },
]

export async function seedDatabase(): Promise<void> {
  await connectDB()

  const existingAdmin = await User.findOne({ email: 'admin@propertycrm.com' })
  if (existingAdmin) {
    console.log('[Seed] Database already seeded.')
    return
  }

  console.log('[Seed] Seeding database...')

  // Create users
  const createdUsers = await Promise.all(
    SEED_USERS.map(async (userData) => {
      const user = new User(userData)
      await user.save()
      return user
    })
  )

  const admin = createdUsers[0]
  const agents = createdUsers.slice(1)

  // Sample leads
  const sampleLeads = [
    { name: 'Usman Malik', phone: '923001234501', email: 'usman@example.com', propertyInterest: 'Residential', budget: 25_000_000, status: 'New', source: 'Facebook Ads', location: 'DHA Lahore', notes: 'Looking for 1 kanal house' },
    { name: 'Fatima Sheikh', phone: '923009876501', email: 'fatima@example.com', propertyInterest: 'Apartment', budget: 15_000_000, status: 'Contacted', source: 'Website', location: 'Bahria Town', notes: '3 bed apartment preferred' },
    { name: 'Hassan Ali', phone: '923011112222', propertyInterest: 'Commercial', budget: 35_000_000, status: 'In Progress', source: 'Walk-in', location: 'Gulberg', notes: 'Office space for business' },
    { name: 'Ayesha Siddiqui', phone: '923022223333', email: 'ayesha@example.com', propertyInterest: 'Plot', budget: 8_000_000, status: 'New', source: 'Referral', location: 'Gulshan-e-Iqbal', notes: '5 marla plot' },
    { name: 'Kamran Iqbal', phone: '923033334444', propertyInterest: 'Farm House', budget: 50_000_000, status: 'New', source: 'Phone Call', location: 'Bedian Road', notes: 'Large farm house' },
    { name: 'Zara Qureshi', phone: '923044445555', email: 'zara@example.com', propertyInterest: 'Residential', budget: 18_000_000, status: 'Contacted', source: 'Facebook Ads', location: 'Model Town', notes: '10 marla house' },
    { name: 'Tariq Mehmood', phone: '923055556666', propertyInterest: 'Apartment', budget: 6_000_000, status: 'Lost', source: 'Website', location: 'Clifton', notes: '1 bed studio' },
    { name: 'Nadia Hussain', phone: '923066667777', email: 'nadia@example.com', propertyInterest: 'Office', budget: 22_000_000, status: 'Closed', source: 'Walk-in', location: 'Blue Area', notes: 'Floor in commercial plaza' },
  ]

  const createdLeads = await Promise.all(
    sampleLeads.map(async (leadData, i) => {
      const agent = agents[i % agents.length]
      const lead = new Lead({
        ...leadData,
        assignedTo: i < 6 ? agent._id : undefined,
        followUpDate: i % 3 === 0 ? new Date(Date.now() - 86400000) : new Date(Date.now() + 86400000 * (i + 1)),
      })
      await lead.save()
      return lead
    })
  )

  // Create activity logs for leads
  await Promise.all(
    createdLeads.map(async (lead) => {
      await Activity.create({
        leadId: lead._id,
        action: 'created',
        performedBy: admin._id,
        details: `Lead "${lead.name}" was created in the system`,
        metadata: { source: lead.source },
      })

      if (lead.assignedTo) {
        await Activity.create({
          leadId: lead._id,
          action: 'assigned',
          performedBy: admin._id,
          details: `Lead assigned to agent`,
          metadata: { assignedTo: lead.assignedTo },
        })
      }
    })
  )

  console.log(`[Seed] Created ${createdUsers.length} users and ${createdLeads.length} leads.`)
  console.log('[Seed] Seed accounts:')
  console.log('  Admin: admin@propertycrm.com / admin123')
  console.log('  Agent: ahmed@propertycrm.com / agent123')
  console.log('  Agent: sara@propertycrm.com / agent123')
  console.log('  Agent: bilal@propertycrm.com / agent123')
}
