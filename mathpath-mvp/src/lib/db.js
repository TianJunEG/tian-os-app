// db.js — MongoDB access for the MathPath MVP.
//
// Collections (DATABASE_SCHEMA.md): students, mastery_profiles, practice_sessions,
// fluency_metrics, recommendations, misconceptions. The static graph (skills/skill_edges)
// lives in code (graph.js), so only learner state is persisted here.
//
// If MONGODB_URI is unset we fall back to a process-local in-memory store so the vertical
// slice still runs end-to-end in a demo. The fallback is NOT durable.

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'mathpath_mvp';

let cached = globalThis.__mathpath_db;
if (!cached) {
  cached = globalThis.__mathpath_db = { client: null, db: null, mem: null, promise: null };
}

// ---- In-memory fallback (no Mongo configured) -----------------------------------------

function createMemoryDb() {
  const store = new Map(); // collectionName -> array of docs
  const col = (name) => {
    if (!store.has(name)) store.set(name, []);
    return store.get(name);
  };
  const match = (doc, q) => Object.entries(q).every(([k, v]) => doc[k] === v);
  let oid = 0;
  return {
    __memory: true,
    collection(name) {
      return {
        async findOne(q = {}) {
          return col(name).find((d) => match(d, q)) || null;
        },
        async find(q = {}) {
          const rows = col(name).filter((d) => match(d, q));
          return { toArray: async () => rows, sort: () => ({ toArray: async () => rows }) };
        },
        async insertOne(doc) {
          const _id = doc._id || `mem_${++oid}`;
          col(name).push({ ...doc, _id });
          return { insertedId: _id };
        },
        async updateOne(q, update, opts = {}) {
          let doc = col(name).find((d) => match(d, q));
          if (!doc && opts.upsert) {
            doc = { ...q, _id: `mem_${++oid}` };
            col(name).push(doc);
          }
          if (doc && update.$set) Object.assign(doc, update.$set);
          if (doc && update.$inc) {
            for (const [k, v] of Object.entries(update.$inc)) doc[k] = (doc[k] || 0) + v;
          }
          return { matchedCount: doc ? 1 : 0 };
        },
      };
    },
  };
}

export async function getDb() {
  if (cached.db) return cached.db;
  if (cached.mem) return cached.mem;

  if (!uri) {
    cached.mem = createMemoryDb();
    return cached.mem;
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(uri).then((client) => {
      cached.client = client;
      cached.db = client.db(dbName);
      return cached.db;
    });
  }
  await cached.promise;
  return cached.db;
}

// Convenience collection accessors.
export async function collections() {
  const db = await getDb();
  return {
    students: db.collection('students'),
    mastery: db.collection('mastery_profiles'),
    sessions: db.collection('practice_sessions'),
    fluency: db.collection('fluency_metrics'),
    recommendations: db.collection('recommendations'),
    misconceptions: db.collection('misconceptions'),
  };
}
