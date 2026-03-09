import mongoose, { Schema, Document, Model } from 'mongoose';

export type Role = 'owner' | 'manager' | 'accountant' | 'viewer';

export interface IPermissions {
  properties?: boolean;
  flats?: boolean;
  tenants?: boolean;
  rent?: boolean;
  payments?: boolean;
  expenses?: boolean;
  balanceSheet?: boolean;
  notes?: boolean;
  users?: boolean;
  reports?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  mobile?: string;
  role: Role;
  ownerId?: mongoose.Types.ObjectId; // For sub-users; null for owner
  permissions: IPermissions;
  isActive: boolean;
  createdAt: Date;
}

const PermissionsSchema = new Schema(
  {
    properties: { type: Boolean, default: true },
    flats: { type: Boolean, default: true },
    tenants: { type: Boolean, default: true },
    rent: { type: Boolean, default: true },
    payments: { type: Boolean, default: true },
    expenses: { type: Boolean, default: true },
    balanceSheet: { type: Boolean, default: true },
    notes: { type: Boolean, default: true },
    users: { type: Boolean, default: false },
    reports: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    mobile: { type: String, trim: true },
    role: { type: String, enum: ['owner', 'manager', 'accountant', 'viewer'], default: 'owner' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    permissions: { type: PermissionsSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ ownerId: 1 });

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
