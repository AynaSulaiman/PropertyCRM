import mongoose, { Document, Schema } from 'mongoose'

export type ActivityAction =
  | 'created'
  | 'status_updated'
  | 'assigned'
  | 'reassigned'
  | 'notes_updated'
  | 'priority_changed'
  | 'followup_set'
  | 'budget_updated'
  | 'contact_updated'
  | 'deleted'

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId
  leadId: mongoose.Types.ObjectId
  action: ActivityAction
  performedBy: mongoose.Types.ObjectId
  details: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

const ActivitySchema = new Schema<IActivity>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'created',
        'status_updated',
        'assigned',
        'reassigned',
        'notes_updated',
        'priority_changed',
        'followup_set',
        'budget_updated',
        'contact_updated',
        'deleted',
      ],
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

ActivitySchema.index({ leadId: 1, createdAt: -1 })

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema)
