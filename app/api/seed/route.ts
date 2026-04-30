import { successResponse, errorResponse } from '@/lib/apiResponse'
import { seedDatabase } from '@/lib/seedData'

export async function POST() {
  try {
    await seedDatabase()
    return successResponse(null, 'Database seeded successfully')
  } catch (error) {
    console.error('[API/seed]', error)
    return errorResponse('Seeding failed', 500)
  }
}
