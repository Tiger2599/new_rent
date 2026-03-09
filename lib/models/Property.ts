import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProperty extends Document {
  name: string;
  propertyNumber: string;
  address: string;
  userId: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    name: { type: String, required: true, trim: true },
    propertyNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PropertySchema.index({ userId: 1, isDeleted: 1 });

export const Property: Model<IProperty> =
  mongoose.models.Property ?? mongoose.model<IProperty>('Property', PropertySchema);
