import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFlat extends Document {
  flatNumber: string;
  propertyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

const FlatSchema = new Schema<IFlat>(
  {
    flatNumber: { type: String, required: true, trim: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FlatSchema.index({ propertyId: 1, isDeleted: 1 });
FlatSchema.index({ userId: 1 });

export const Flat: Model<IFlat> = mongoose.models.Flat ?? mongoose.model<IFlat>('Flat', FlatSchema);
