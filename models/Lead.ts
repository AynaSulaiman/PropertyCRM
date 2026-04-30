import mongoose, { Document, Schema } from 'mongoose'

export type LeadStatus = 'New' | 'Contacted' | 'In Progress' | 'Closed' | 'Lost'
export type LeadPriority = 'High' | 'Medium' | 'Low'
export type PropertyInterest = 'Residential' | 'Commercial' | 'Plot' | 'Farm House' | 'Apartment' | 'Office'
export type LeadSource = 'Facebook Ads' | 'Walk-in' | 'Website' | 'Referral' | 'Phone Call' | 'Other'

export interface ILead extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email?: string
  phone: string
  propertyInterest: PropertyInterest
  location?: string
  budget: number
  status: LeadStatus
  priority: LeadPriority
  score: number
  notes?: string
  assignedTo?: mongoose.Types.ObjectId
  source: LeadSource
  followUpDate?: Date
  lastActivityAt: Date
  isStale: boolean
  createdAt: Date
  updatedAt: Date
}

const LeadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    propertyInterest: {
      type: String,
      enum: ['Residential', 'Commercial', 'Plot', 'Farm House', 'Apartment', 'Office'],
      required: [true, 'Property interest is required'],
    },
    location: {
      type: String,
      trim: true,
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'In Progress', 'Closed', 'Lost'],
      default: 'New',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Low',
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    source: {
      type: String,
      enum: ['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Phone Call', 'Other'],
      default: 'Other',
    },
    followUpDate: {
      type: Date,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    isStale: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Auto-score lead based on budget (in PKR Millions)
LeadSchema.pre('save', function (next) {
  if (this.isModified('budget') || this.isNew) {
    const budgetInMillions = this.budget / 1_000_000

    if (budgetInMillions > 20) {
      this.priority = 'High'
      this.score = 90 + Math.min(10, Math.floor((budgetInMillions - 20) / 5))
    } else if (budgetInMillions >= 10) {
      this.priority = 'Medium'
      this.score = 50 + Math.floor(((budgetInMillions - 10) / 10) * 40)
    } else {
      this.priority = 'Low'
      this.score = Math.floor((budgetInMillions / 10) * 50)
    }
  }
  next()
})

// Index for performance
LeadSchema.index({ assignedTo: 1, status: 1 })
LeadSchema.index({ priority: 1, createdAt: -1 })
LeadSchema.index({ followUpDate: 1 })

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema)
