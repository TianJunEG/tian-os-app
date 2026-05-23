import mongoose from 'mongoose';

// One practice attempt at spelling a single word, used for progress stats and
// for weighting "surprise" / revision toward words the student finds tricky.
const spellingAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SpellingList',
    default: null
  },
  mode: {
    type: String,
    enum: [
      'mock',
      'dictation',
      'scramble',
      'missing',
      'lookcover',
      'wordsearch',
      'crossword',
      'surprise',
      'misspelt',
      'revision'
    ],
    default: 'mock'
  },
  word: {
    type: String,
    required: true,
    trim: true
  },
  correct: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

spellingAttemptSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('SpellingAttempt', spellingAttemptSchema);
