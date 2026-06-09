import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  password: string;
  profilePicture?: string;
  grade: string; // e.g., "ט1", "י2", "יא3", "יב4"
  gradeChangesLeft: number; // starts at 4
  bio?: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  isBanned: boolean;
  banReason?: string;
  role: 'student' | 'admin';
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  savedPosts: mongoose.Types.ObjectId[];
  language: 'he' | 'ru';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@edu-darom\.org\.il$/, 'Only @edu-darom.org.il emails are allowed'],
  },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  profilePicture: { type: String, default: '' },
  grade: {
    type: String,
    required: true,
    enum: [
      'ט1','ט2','ט3','ט4','ט5','ט6','ט7','ט8',
      'י1','י2','י3','י4','י5','י6','י7','י8',
      'יא1','יא2','יא3','יא4','יא5','יא6','יא7','יא8',
      'יב1','יב2','יב3','יב4','יב5','יב6','יב7','יב8',
    ],
  },
  gradeChangesLeft: { type: Number, default: 4 },
  bio: { type: String, maxlength: 160 },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  language: { type: String, enum: ['he', 'ru'], default: 'he' },
  lastSeen: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

UserSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.verificationTokenExpiry;
  return obj;
};

export default mongoose.model<IUser>('User', UserSchema);
