import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'residential' | 'commercial';
  status: 'lead' | 'active' | 'inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['residential', 'commercial'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['lead', 'active', 'inactive'], 
      default: 'lead' 
    },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model<IClient>('Client', clientSchema);
