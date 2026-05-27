import mongoose from 'mongoose';

// Top of the knowledge graph. MVP focus is Math; Science/English(Spelling)
// reserved for later phases. English contains ONLY Spelling — no Reading,
// Comprehension, Writing, or Cloze in the MVP.
const subjectSchema = new mongoose.Schema({
  key: { type: String, enum: ['math', 'science', 'english'], required: true, unique: true },
  name: { type: String, required: true },
  order: { type: Number, default: 0 }
});

export default mongoose.model('Subject', subjectSchema);
