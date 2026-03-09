import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRentPayment extends Document {
  tenantId: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  month: number;
  year: number;
  note?: string;
  createdAt: Date;
}

const RentPaymentSchema = new Schema<IRentPayment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

RentPaymentSchema.index({ tenantId: 1, month: 1, year: 1 });
RentPaymentSchema.index({ paymentDate: -1 });

export const RentPayment: Model<IRentPayment> =
  mongoose.models.RentPayment ?? mongoose.model<IRentPayment>('RentPayment', RentPaymentSchema);
