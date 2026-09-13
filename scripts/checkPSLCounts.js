import dotenv from 'dotenv'; dotenv.config();
import mongoose from 'mongoose';
import PSLSkill from '../models/psl/PSLSkill.js';
import PSLTemplate from '../models/psl/PSLProblemTemplate.js';
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match');
console.log('PSLSkills:', await PSLSkill.countDocuments());
console.log('PSLTemplates:', await PSLTemplate.countDocuments());
await mongoose.disconnect();
