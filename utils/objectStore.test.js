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
  signedUrls: new Map(), // key -> URL string
}));

vi.mock('../services/storage/r2.js', () => ({
  default: {
    isConfigured: () => h.configured,
    putObject: async (key, body) => { h.store.set(key, Buffer.from(body)); return key; },
    getObjectBuffer: async (key) => {
      if (!h.store.has(key)) throw new Error('NoSuchKey');
      return h.store.get(key);
    },
    getSignedDownloadUrl: async (key) => {
      return h.signedUrls.get(key) || `https://r2.example.com/${key}?signed=1`;
    },
  },
}));

let store;
beforeEach(async () => {
  h.configured = false;
  h.store.clear();
  h.signedUrls.clear();
  vi.resetModules();
  store = await import('../services/storage/objectStore.js');
});

describe('R2 configured', () => {
  beforeEach(() => { h.configured = true; });

  it('writes to R2 and returns a /uploads fileUrl', async () => {
    const saved = await store.putUpload({
      namespace: 'mathpath-paper-analysis', filename: 'paper_1.pdf',
      buffer: Buffer.from('PDFBYTES'), contentType: 'application/pdf',
    });
    expect(saved).toEqual({
      storageKey: 'mathpath-paper-analysis/paper_1.pdf',
      storageProvider: 'r2',
      fileUrl: '/uploads/mathpath-paper-analysis/paper_1.pdf',
    });

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

describe('persistUploadFile', () => {
  let tmp;
  beforeEach(async () => {
    h.configured = false;
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'objstore-persist-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('generates a unique filename and writes to disk', async () => {
    const file = { originalname: 'scan.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('SCANDATA'), size: 8 };
    const result = await store.persistUploadFile(file, 'worksheets');
    expect(result.storageProvider).toBe('disk');
    expect(result.fileUrl).toMatch(/^\/uploads\/worksheets\/.+\.jpg$/);
    const buf = await store.getUploadBuffer(result);
    expect(buf.toString()).toBe('SCANDATA');
  });

  it('writes to R2 when configured and returns /uploads fileUrl', async () => {
    h.configured = true;
    const file = { originalname: 'creds.pdf', mimetype: 'application/pdf', buffer: Buffer.from('CREDDATA'), size: 8 };
    const result = await store.persistUploadFile(file, 'credentials');
    expect(result.storageProvider).toBe('r2');
    expect(result.fileUrl).toMatch(/^\/uploads\/credentials\/.+\.pdf$/);
  });

  it('uses index to vary filename when multiple files are written', async () => {
    const file = { originalname: 'work.png', mimetype: 'image/png', buffer: Buffer.from('X'), size: 1 };
    const [r0, r1] = await Promise.all([
      store.persistUploadFile(file, 'mathpath-working/sess1', 0),
      store.persistUploadFile(file, 'mathpath-working/sess1', 1),
    ]);
    expect(r0.fileUrl).not.toBe(r1.fileUrl);
  });
});

describe('signedUrlForUploadPath', () => {
  it('returns null when R2 is not configured', async () => {
    h.configured = false;
    const url = await store.signedUrlForUploadPath('/uploads/worksheets/foo.jpg');
    expect(url).toBeNull();
  });

  it('returns a signed URL when R2 is configured', async () => {
    h.configured = true;
    const url = await store.signedUrlForUploadPath('/uploads/worksheets/bar.png');
    expect(typeof url).toBe('string');
    expect(url).toContain('bar.png');
  });

  it('strips leading /uploads/ prefix before signing', async () => {
    h.configured = true;
    h.signedUrls.set('credentials/my-file.pdf', 'https://r2.example.com/signed-creds');
    const url = await store.signedUrlForUploadPath('/uploads/credentials/my-file.pdf');
    expect(url).toBe('https://r2.example.com/signed-creds');
  });

  it('returns null for an empty path', async () => {
    h.configured = true;
    expect(await store.signedUrlForUploadPath('')).toBeNull();
    expect(await store.signedUrlForUploadPath(null)).toBeNull();
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
