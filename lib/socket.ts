import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'

let io: SocketIOServer | null = null

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`)

    // Join role-based rooms
    socket.on('join_room', (data: { role: string; userId: string }) => {
      socket.join(data.role) // 'admin' or 'agent'
      socket.join(`user_${data.userId}`)
      console.log(`[Socket.io] User ${data.userId} joined rooms: ${data.role}, user_${data.userId}`)
    })

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`)
    })
  })

  return io
}

export function getSocketServer(): SocketIOServer | null {
  return io
}

export interface SocketEvents {
  lead_created: { lead: object; message: string }
  lead_assigned: { lead: object; agentId: string; message: string }
  lead_updated: { lead: object; message: string }
  lead_deleted: { leadId: string; message: string }
  priority_changed: { leadId: string; priority: string; message: string }
}

export function emitLeadCreated(lead: object): void {
  if (!io) return
  io.to('admin').emit('lead_created', {
    lead,
    message: `New lead added`,
  })
}

export function emitLeadAssigned(lead: object & { assignedTo?: string }, agentId: string): void {
  if (!io) return
  io.to('admin').emit('lead_assigned', { lead, agentId, message: 'Lead assigned to agent' })
  io.to(`user_${agentId}`).emit('lead_assigned', { lead, agentId, message: 'New lead assigned to you' })
}

export function emitLeadUpdated(lead: object): void {
  if (!io) return
  io.to('admin').emit('lead_updated', { lead, message: 'Lead updated' })
}

export function emitLeadDeleted(leadId: string): void {
  if (!io) return
  io.to('admin').emit('lead_deleted', { leadId, message: 'Lead deleted' })
}
