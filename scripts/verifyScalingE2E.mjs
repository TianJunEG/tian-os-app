// Local end-to-end verification of the Phase 1+2 path:
//   storage facade (save) → enqueue (web side) → SEPARATE worker process
//   → pipeline runs → status persisted to Mongo → client poll observes it.
//
// Run with REDIS_URL + MONGODB_URI + JOB_QUEUE_ENABLED=1 pointing at local
// Redis/Mongo. The worker is spawned as its own process (npm run worker) so this
// genuinely proves cross-process delivery, not an in-process shortcut.
import { spawn } from 'child_process';
import mongoose from 'mongoose';
import PaperAnalysis from '../models/mathpath/PaperAnalysis.js';
import { putUpload, getUploadBuffer } from '../services/storage/objectStore.js';
import { getQueue, isQueueEnabled, QUEUE_NAMES, closeQueues } from '../config/queue.js';

const log = (...a) => console.log('[e2e]', ...a);

// Build a minimal but valid single-page PDF with correct xref byte offsets, so
// pdf-parse reads it offline (no Tesseract/network). Text has no question
// structure, so the pipeline reaches needs_review WITHOUT any AI call.
function buildPdf() {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null, // contents stream, built below
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const streamText = 'BT /F1 14 Tf 20 120 Td (Scaling e2e check page) Tj ET';
  objs[3] = `<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream`;

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((body, i) => {
    offsets[i] = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => { pdf += `${String(off).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

const TERMINAL = new Set(['needs_review', 'reviewed', 'failed']);

async function main() {
  let worker;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log('connected to mongo');

    if (!isQueueEnabled()) throw new Error('queue not enabled — set REDIS_URL + JOB_QUEUE_ENABLED=1');

    // 1) Save the upload via the storage facade (disk locally; R2 in prod).
    const pdf = buildPdf();
    const saved = await putUpload({
      namespace: 'mathpath-paper-analysis',
      filename: `e2e_${Date.now()}.pdf`,
      buffer: pdf,
      contentType: 'application/pdf',
    });
    log('saved upload:', { provider: saved.storageProvider, key: saved.storageKey });

    // 1a) Prove the facade round-trips the exact bytes (what the worker reads).
    const readBack = await getUploadBuffer(saved);
    if (!readBack || !readBack.equals(pdf)) throw new Error('facade round-trip mismatch');
    log('facade read-back OK (bytes match)');

    // 2) Create the analysis doc (as the upload route does).
    const analysis = await PaperAnalysis.create({
      studentId: 'e2e_student',
      uploadedByUserId: 'e2e_user',
      uploadedByRole: 'parent',
      subjectId: 'math',
      domainId: 'fractions',
      uploadType: 'completed_unmarked',
      sourceType: 'adult_upload',
      status: 'uploaded',
      detectedQuestions: [],
      originalFilename: 'e2e.pdf',
      ...saved,
    });
    log('created PaperAnalysis', String(analysis._id), 'status=uploaded');

    // 3) Enqueue exactly like the route's enqueuePaperAnalysis().
    const queue = getQueue(QUEUE_NAMES.paperAnalysis);
    const job = await queue.add('run', {
      analysisId: String(analysis._id),
      mimeType: 'application/pdf',
      filename: 'e2e.pdf',
    });
    log('enqueued job', job.id);

    // 4) Spawn the REAL worker process.
    worker = spawn('node', ['workers/index.js'], {
      env: process.env,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    log('spawned worker pid', worker.pid);

    // 5) Poll Mongo (the client's GET /:id) until a terminal status.
    const started = Date.now();
    let last = 'uploaded';
    let finalDoc = null;
    while (Date.now() - started < 30000) {
      const doc = await PaperAnalysis.findById(analysis._id).lean();
      if (doc.status !== last) { log('status →', doc.status); last = doc.status; }
      if (TERMINAL.has(doc.status)) { finalDoc = doc; break; }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!finalDoc) throw new Error(`timed out; last status=${last}`);
    const stages = (finalDoc.pipelineLog || []).map((l) => l.stage);
    log('pipeline stages:', stages.join(' → '));
    log('FINAL status:', finalDoc.status);

    const crossProcess = stages.includes('processing'); // only the worker writes these
    if (!crossProcess) throw new Error('no pipeline stages recorded — worker did not run the job');

    log(`RESULT: PASS — worker (pid ${worker.pid}) processed the enqueued job off-process and persisted "${finalDoc.status}".`);
    process.exitCode = 0;
  } catch (err) {
    log('RESULT: FAIL —', err.message);
    process.exitCode = 1;
  } finally {
    if (worker) worker.kill('SIGTERM');
    await closeQueues().catch(() => {});
    await mongoose.connection.close().catch(() => {});
  }
}

main();
