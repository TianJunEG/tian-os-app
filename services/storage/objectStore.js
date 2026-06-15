// Upload storage facade (Phase 2). Writes/reads uploaded files to Cloudflare R2
// when it's configured, otherwise to the local `uploads/` disk — the same fallback
// philosophy as Redis/queue. This is what lets a separate worker process read an
// uploaded file it never received: with R2, both web and worker reach shared
// storage by opaque key. See docs/architecture/Scaling_Phase1_Redis_JobQueue.md
// and the Phase 2 notes.
import fs from 'fs/promises';
import path from 'path';
import r2 from './r2.js';

const LOCAL_ROOT = path.join(process.cwd(), 'uploads');

export function isObjectStorageConfigured() {
  return r2.isConfigured();
}

// Persist bytes under `namespace/filename`. Returns the fields a model needs:
//   storageKey      — opaque R2 key OR absolute disk path (read it back via getUploadBuffer)
//   storageProvider — 'r2' | 'disk' (authoritative for reads)
//   fileUrl         — always '/uploads/<namespace>/<filename>'. The server's
//                     /uploads handler 302-redirects this to a signed R2 URL when
//                     object storage is configured, else serves it from disk — so
//                     the public URL shape is identical regardless of backend.
export async function putUpload({ namespace, filename, buffer, contentType }) {
  const key = `${namespace}/${filename}`;
  const fileUrl = `/uploads/${namespace}/${filename}`;
  if (isObjectStorageConfigured()) {
    await r2.putObject(key, buffer, contentType);
    return { storageKey: key, storageProvider: 'r2', fileUrl };
  }
  const diskPath = path.join(LOCAL_ROOT, namespace, filename);
  await fs.mkdir(path.dirname(diskPath), { recursive: true });
  await fs.writeFile(diskPath, buffer);
  return { storageKey: diskPath, storageProvider: 'disk', fileUrl };
}

// Convenience for routes using in-memory multer: persist an uploaded file under
// `namespace` with a unique filename. Returns { storageKey, storageProvider,
// fileUrl }. `index` varies the name when persisting several files in one request.
export async function persistUploadFile(file, namespace, index = 0) {
  const ext = path.extname(file.originalname || '') || '';
  const filename = `${Date.now()}-${index}-${Math.round(Math.random() * 1e9)}${ext}`;
  return putUpload({ namespace, filename, buffer: file.buffer, contentType: file.mimetype });
}

// Resolve a public '/uploads/<key>' request path to a short-lived signed R2 URL,
// or null when object storage isn't configured (caller falls back to disk).
export async function signedUrlForUploadPath(uploadPath, ttlSeconds = 300) {
  if (!isObjectStorageConfigured()) return null;
  const key = String(uploadPath || '').replace(/^\/+/, '').replace(/^uploads\//, '');
  if (!key) return null;
  return r2.getSignedDownloadUrl(key, ttlSeconds);
}

// Read bytes back as a Buffer, or null if unavailable. `storageProvider` is
// authoritative; when absent (legacy rows) we infer: an absolute path is disk,
// otherwise R2 when configured. Errors resolve to null so callers degrade.
export async function getUploadBuffer({ storageKey, storageProvider } = {}) {
  if (!storageKey) return null;
  const provider = storageProvider
    || (path.isAbsolute(storageKey) ? 'disk' : (isObjectStorageConfigured() ? 'r2' : 'disk'));
  try {
    if (provider === 'r2') return await r2.getObjectBuffer(storageKey);
    return await fs.readFile(storageKey);
  } catch {
    return null;
  }
}

export default { isObjectStorageConfigured, putUpload, getUploadBuffer, persistUploadFile, signedUrlForUploadPath };
