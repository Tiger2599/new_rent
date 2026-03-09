import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
  title: string;
  description?: string;
  isPinned: boolean;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    isPinned: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

NoteSchema.index({ userId: 1 });
NoteSchema.index({ userId: 1, isPinned: 1 });

export const Note: Model<INote> = mongoose.models.Note ?? mongoose.model<INote>('Note', NoteSchema);
