import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IService extends Document {
  client: Types.ObjectId;
  employee: Types.ObjectId;
  serviceDate: Date;
  serviceType: 'regular' | 'deep' | 'move_in' | 'move_out' | 'other';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  address: string;
  notes?: string;
  payment: {
    amount: number;
    method: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    paymentDate?: Date;
  };
  duration: number; // in minutes
  tasks: string[];
  rating?: number;
  feedback?: string;
}

const serviceSchema = new Schema<IService>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    serviceDate: { type: Date, required: true },
    serviceType: {
      type: String,
      enum: ['regular', 'deep', 'move_in', 'move_out', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    address: { type: String, required: true },
    notes: String,
    payment: {
      amount: { type: Number, required: true },
      method: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: String,
      paymentDate: Date,
    },
    duration: { type: Number, required: true }, // in minutes
    tasks: [{ type: String }],
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
  },
  { timestamps: true }
);

// Indexes for better query performance
serviceSchema.index({ client: 1, serviceDate: -1 });
serviceSchema.index({ employee: 1, serviceDate: -1 });
serviceSchema.index({ status: 1, serviceDate: 1 });

export default mongoose.model<IService>('Service', serviceSchema);
