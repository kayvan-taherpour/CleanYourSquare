import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'cleaner' | 'supervisor' | 'manager';
  status: 'active' | 'inactive' | 'on_leave';
  hireDate: Date;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  notes?: string;
}

const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    role: {
      type: String,
      enum: ['cleaner', 'supervisor', 'manager'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave'],
      default: 'active',
    },
    hireDate: { type: Date, default: Date.now },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model<IEmployee>('Employee', employeeSchema);
