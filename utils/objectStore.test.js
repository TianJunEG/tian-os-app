// Phase 2: storage facade (services/storage/objectStore.js). The R2 client is
// mocked so we can assert provider selection (R2 vs local disk) and the read-back
// contract without network or AWS SDK. Disk-path cases use a temp dir.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const h = vi.hoisted(() => ({
  configured: false,
  store: new Map(), // key -> Buffer
}));

vi.mock('../services/storage/r2.js', () => ({
  default: {
    isConfigured: () => h.configured,
    putObject: async (key, body) => { h.store.set(key, Buffer.from(body)); return key; },
    getObjectBuffer: async (key) => {
      if (!h.store.has(key)) throw new Error('NoSuchKey');
      return h.store.get(key);
    },
  },
}));

let store;
beforeEach(async () => {
  h.configured = false;
  h.store.clear();
  vi.resetModules();
  store = await import('../services/storage/objectStore.js');
});

describe('R2 configured', () => {
  beforeEach(() => { h.configured = true; });

  it('writes to R2 with an opaque key and no public fileUrl, and reads it back', async () => {
    const saved = await store.putUpload({
      namespace: 'mathpath-paper-analysis', filename: 'paper_1.pdf',
      buffer: Buffer.from('PDFBYTES'), contentType: 'application/pdf',
    });
    expect(saved).toEqual({ storageKey: 'mathpath-paper-analysis/paper_1.pdf', storageProvider: 'r2', fileUrl: '' });

    const buf = await store.getUploadBuffer(saved);
    expect(buf.toString()).toBe('PDFBYTES');
  });

  it('returns null when the R2 object is missing instead of throwing', async () => {
    const buf = await store.getUploadBuffer({ storageKey: 'missing/x.pdf', storageProvider: 'r2' });
    expect(buf).toBeNull();
  });
});

describe('R2 not configured → local disk', () => {
  let tmp;
  beforeEach(async () => {
    h.configured = false;
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'objstore-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('writes to disk with an absolute key + /uploads fileUrl, and reads it back', async () => {
    const saved = await store.putUpload({
      namespace: 'mathpath-paper-analysis', filename: 'paper_2.png',
      buffer: Buffer.from('IMG'), contentType: 'image/png',
    });
    expect(saved.storageProvider).toBe('disk');
    expect(path.isAbsolute(saved.storageKey)).toBe(true);
    expect(saved.fileUrl).toBe('/uploads/mathpath-paper-analysis/paper_2.png');

    const buf = await store.getUploadBuffer(saved);
    expect(buf.toString()).toBe('IMG');
  });
});

describe('legacy rows without storageProvider', () => {
  it('infers disk for an absolute path', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'objstore-legacy-'));
    const p = path.join(tmp, 'legacy.pdf');
    await fs.writeFile(p, 'LEGACY');
    const buf = await store.getUploadBuffer({ storageKey: p }); // no provider
    expect(buf.toString()).toBe('LEGACY');
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('infers R2 for a relative key when R2 is configured', async () => {
    h.configured = true;
    h.store.set('ns/rel.pdf', Buffer.from('VIA_R2'));
    const buf = await store.getUploadBuffer({ storageKey: 'ns/rel.pdf' }); // no provider
    expect(buf.toString()).toBe('VIA_R2');
  });

  it('returns null for a missing key (no storageKey)', async () => {
    expect(await store.getUploadBuffer({})).toBeNull();
  });
});
