import mongoose from 'mongoose';

const partnerInquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    organization: {
      type: String,
      trim: true,
      maxlength: [150, 'Organization cannot exceed 150 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'archived'],
      default: 'new'
    }
  },
  { timestamps: true }
);

export default mongoose.model('PartnerInquiry', partnerInquirySchema);
