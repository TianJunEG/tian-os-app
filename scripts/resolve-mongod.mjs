// Resolves (downloading if needed) a local mongod binary and prints its path.
// Used by the SessionStart hook to provision a runnable MongoDB. Requires the
// environment's network policy to permit MongoDB's binary CDN.
import { MongoBinary } from 'mongodb-memory-server-core';

const version = process.env.MONGOMS_VERSION || '7.0.14';
const binPath = await MongoBinary.getPath({ version });
process.stdout.write(binPath);
