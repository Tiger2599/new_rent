import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExpenseCategory = 'maintenance' | 'utilities' | 'cleaning' | 'security' | 'other';

export interface IExpense extends Document {
  name: string;
  amount: number;
  date: Date;
  note?: string;
  category?: ExpenseCategory;
  propertyId?: mongoose.Types.ObjectId;
  flatId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    note: { type: String },
    category: { type: String, enum: ['maintenance', 'utilities', 'cleaning', 'security', 'other'] },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    flatId: { type: Schema.Types.ObjectId, ref: 'Flat' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, date: -1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense ?? mongoose.model<IExpense>('Expense', ExpenseSchema);
