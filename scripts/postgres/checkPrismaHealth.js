import dotenv from 'dotenv';
import { checkPrismaHealth } from '../../services/db/prismaClient.js';

dotenv.config();

const result = await checkPrismaHealth();
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
