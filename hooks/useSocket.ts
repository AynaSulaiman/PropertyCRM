'use client'
import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'

interface UseSocketOptions {
  userId?: string
  role?: string
  onLeadCreated?: (data: { lead: object; message: string }) => void
  onLeadAssigned?: (data: { lead: object; agentId: string; message: string }) => void
  onLeadUpdated?: (data: { lead: object; message: string }) => void
  onLeadDeleted?: (data: { leadId: string; message: string }) => void
}

export function useSocket(options: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null)

  const connect = useCallback(() => {
    if (!options.userId || socketRef.current?.connected) return

    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })

    socket.on('connect', () => {
      socket.emit('join_room', { userId: options.userId, role: options.role })
    })

    socket.on('lead_created', (data) => {
      options.onLeadCreated?.(data)
      if (options.role === 'admin') {
        toast('🏠 ' + data.message, { style: { background: '#39375B', color: 'white' } })
      }
    })

    socket.on('lead_assigned', (data) => {
      options.onLeadAssigned?.(data)
      toast('📋 ' + data.message, { style: { background: '#745C97', color: 'white' } })
    })

    socket.on('lead_updated', (data) => {
      options.onLeadUpdated?.(data)
    })

    socket.on('lead_deleted', (data) => {
      options.onLeadDeleted?.(data)
      if (options.role === 'admin') {
        toast('🗑️ ' + data.message, { style: { background: '#ef4444', color: 'white' } })
      }
    })

    socket.on('connect_error', () => {
      // Silently fail - app works without socket
    })

    socketRef.current = socket
  }, [options])

  useEffect(() => {
    connect()
    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [connect])

  return socketRef.current
}
