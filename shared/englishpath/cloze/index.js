// ELPath · Comprehension Cloze — public surface.
// A separate module from the vocabulary engine — it grades TYPED answers against
// per-blank accept-sets, which is a genuinely different task from the MCQ engine.
export * from './clozeGrader.js';
export * from './clozePassages.js';
export * from './clozeEngine.js';
