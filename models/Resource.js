import mongoose from 'mongoose';

export const RESOURCE_CATEGORIES = ['understanding-moe', 'worksheets', 'activities', 'partners'];

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    category: {
      type: String,
      enum: RESOURCE_CATEGORIES,
      required: [true, 'Category is required']
    },
    level: {
      type: String,
      trim: true,
      maxlength: 60
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 60
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [400, 'Summary cannot exceed 400 characters']
    },
    body: {
      type: String,
      maxlength: [20000, 'Body cannot exceed 20000 characters']
    },
    fileUrl: {
      type: String
    },
    published: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Resource', resourceSchema);
