import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  mobile: string;
  rentAmount: number;
  depositAmount: number;
  depositPending: number;
  joinDate: Date;
  leaveDate?: Date;
  notes?: string;
  propertyId: mongoose.Types.ObjectId;
  flatId: mongoose.Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    rentAmount: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, default: 0, min: 0 },
    depositPending: { type: Number, default: 0, min: 0 },
    joinDate: { type: Date, required: true },
    leaveDate: { type: Date },
    notes: { type: String },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TenantSchema.index({ propertyId: 1, isDeleted: 1 });
TenantSchema.index({ flatId: 1 });
TenantSchema.index({ name: 'text', mobile: 'text' });

export const Tenant: Model<ITenant> =
  mongoose.models.Tenant ?? mongoose.model<ITenant>('Tenant', TenantSchema);
