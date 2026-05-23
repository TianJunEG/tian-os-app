import mongoose from 'mongoose';

const resourceLeadSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource'
    },
    // Snapshot of the title so leads stay readable even if the resource is renamed/deleted.
    resourceTitle: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model('ResourceLead', resourceLeadSchema);
