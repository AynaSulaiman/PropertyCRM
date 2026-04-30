'use client'
import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', isLoading
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <p className="text-gray-600 text-sm">{message}</p>
        <div className="flex gap-3 w-full">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button className="btn-danger flex-1" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
