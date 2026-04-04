import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOtherIncome extends Document {
  name: string;
  amount: number;
  date: Date;
  note?: string;
  userId: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
}

const OtherIncomeSchema = new Schema<IOtherIncome>(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    note: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OtherIncomeSchema.index({ userId: 1, date: -1 });

export const OtherIncome: Model<IOtherIncome> =
  mongoose.models.OtherIncome ?? mongoose.model<IOtherIncome>('OtherIncome', OtherIncomeSchema);
