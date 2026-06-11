import mongoose from 'mongoose';

// A single spelling word, optionally with an example sentence and definition.
// The tested word is `word`; when a `sentence` is provided the word is expected
// to appear within it (teachers read the sentence then repeat the word).
const wordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: [true, 'A spelling word is required'],
      trim: true,
      maxlength: [60, 'A word cannot be longer than 60 characters']
    },
    sentence: {
      type: String,
      default: '',
      maxlength: [400, 'A sentence cannot be longer than 400 characters']
    },
    definition: {
      type: String,
      default: '',
      maxlength: [600, 'A definition cannot be longer than 600 characters']
    },
    notes: {
      type: String,
      default: '',
      maxlength: [300, 'Notes cannot be longer than 300 characters']
    }
  },
  { _id: true }
);

const spellingListSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please give the list a title'],
    trim: true,
    maxlength: [120, 'Title cannot be longer than 120 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot be longer than 500 characters']
  },
  // Singapore-style primary levels plus a catch-all.
  level: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'other'],
    default: 'other'
  },
  // The language being practised. English/Malay use the Latin alphabet; Chinese
  // is character-based and practised by handwriting rather than typing.
  language: {
    type: String,
    enum: ['en', 'ms', 'zh'],
    default: 'en',
    index: true
  },
  words: {
    type: [wordSchema],
    default: []
  },
  isShared: {
    type: Boolean,
    default: false,
    index: true
  },
  // How the list was originally created (manual entry or extracted from a file).
  sourceType: {
    type: String,
    enum: ['manual', 'pdf', 'docx', 'doc', 'image', 'text'],
    default: 'manual'
  },
  // Set when a list is copied from a shared list in the library.
  copiedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SpellingList',
    default: null
  },
  copyCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

spellingListSchema.index({ isShared: 1, level: 1, updatedAt: -1 });
spellingListSchema.index({ title: 'text', description: 'text' });

spellingListSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('SpellingList', spellingListSchema);
