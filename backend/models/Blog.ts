import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  coverImage: string;
  author: mongoose.Types.ObjectId;
  authorName: string;
  authorAvatar: string;
  status: 'published' | 'draft';
  readingTime: number;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a story title'],
      trim: true,
      maxlength: [160, 'Title cannot exceed 160 characters'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide story content'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
      default: 'General',
    },
    coverImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorAvatar: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
    },
    readingTime: {
      type: Number,
      default: 1,
      min: 1,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto generate slug from title before validation if missing
BlogSchema.pre<IBlog>('validate', function () {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
});

export const Blog: Model<IBlog> =
  mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);
