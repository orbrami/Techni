import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  mediaType?: 'image' | 'video' | null;
  mediaUrl?: string;
  mediaThumbnail?: string;
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  shares: mongoose.Types.ObjectId[];
  sharedFrom?: mongoose.Types.ObjectId;
  visibility: 'all' | 'grade' | 'year'; // year = same school year (e.g., all י students)
  targetGrade?: string;
  isDeleted: boolean;
  deletedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 500 },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const PostSchema = new Schema<IPost>({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 2000, default: '' },
  mediaType: { type: String, enum: ['image', 'video', null], default: null },
  mediaUrl: { type: String },
  mediaThumbnail: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema],
  shares: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  sharedFrom: { type: Schema.Types.ObjectId, ref: 'Post' },
  visibility: { type: String, enum: ['all', 'grade', 'year'], default: 'all' },
  targetGrade: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
}, {
  timestamps: true,
});

// Index for feed performance
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });

export default mongoose.model<IPost>('Post', PostSchema);
