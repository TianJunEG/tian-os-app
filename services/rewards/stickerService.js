import StudentSticker from '../../models/StudentSticker.js';
import {
  STICKER_BY_CODE,
  isValidStickerCode,
  pickAutoSticker,
  stickerChartProgress,
} from '../../shared/rewards/stickerCatalog.js';

// Award a sticker to a student. With a dedupeKey the award is idempotent (the
// same milestone never doubles up); without one it always adds a new sticker.
// Returns { sticker, created }.
export async function awardSticker({ studentId, stickerCode, source = 'tutor', awardedByUserId = null, note = '', dedupeKey = '' }) {
  if (!studentId) throw Object.assign(new Error('studentId required.'), { status: 400 });
  if (!isValidStickerCode(stickerCode)) throw Object.assign(new Error('Unknown sticker.'), { status: 400 });
  const cleanNote = String(note || '').trim().slice(0, 280);

  if (dedupeKey) {
    const existing = await StudentSticker.findOne({ studentId, dedupeKey });
    if (existing) return { sticker: existing, created: false };
    try {
      const sticker = await StudentSticker.create({ studentId, stickerCode, source, awardedByUserId, note: cleanNote, dedupeKey });
      return { sticker, created: true };
    } catch (err) {
      if (err?.code === 11000) { // lost an idempotency race — return the winner
        return { sticker: await StudentSticker.findOne({ studentId, dedupeKey }), created: false };
      }
      throw err;
    }
  }
  const sticker = await StudentSticker.create({ studentId, stickerCode, source, awardedByUserId, note: cleanNote });
  return { sticker, created: true };
}

// The full reward-chart state for a student: every collected sticker enriched
// with its catalog art/label, plus goal-chart progress derived from the count.
export async function getStudentStickerState(studentId) {
  const rows = await StudentSticker.find({ studentId }).sort({ earnedAt: -1 }).lean();
  const stickers = rows.map((r) => {
    const def = STICKER_BY_CODE[r.stickerCode] || { code: r.stickerCode, label: r.stickerCode, image: '', kind: 'fluent' };
    return {
      id: String(r._id),
      code: r.stickerCode,
      label: def.label,
      image: def.image,
      kind: def.kind,
      source: r.source,
      note: r.note || '',
      earnedAt: r.earnedAt,
    };
  });
  return { stickers, total: stickers.length, progress: stickerChartProgress(stickers.length) };
}

// Auto rule: a strong homework week (overall accuracy >= threshold over a
// meaningful number of questions) earns one rotating sticker, keyed to the note
// so re-saves don't double-award.
export async function awardHomeworkSticker({ studentId, noteId, correct, total, threshold = 80, minQuestions = 5 }) {
  if (!studentId || !noteId || !total || total < minQuestions) return null;
  const accuracy = Math.round((correct / total) * 100);
  if (accuracy < threshold) return null;
  const { sticker, created } = await awardSticker({
    studentId,
    stickerCode: pickAutoSticker(accuracy + total),
    source: 'auto',
    note: `Great homework week — ${accuracy}%!`,
    dedupeKey: `hw:${noteId}`,
  });
  return created ? sticker : null;
}

// ── Practice-earned stickers ─────────────────────────────────────────────────
// Students collect stickers from their OWN work (not just tutor-awarded homework).
// Each is idempotent via a milestone-specific dedupeKey so a resubmit/re-complete
// never doubles up. All are best-effort: callers must swallow errors so a sticker
// failure never blocks saving the practice result.

// A flawless practice/fluency round (all correct over a meaningful number of Qs).
export async function awardPerfectRoundSticker({ studentId, sessionId, correct, total, minQuestions = 5 }) {
  if (!studentId || !sessionId || !total || total < minQuestions || correct !== total) return null;
  const { sticker, created } = await awardSticker({
    studentId, stickerCode: pickAutoSticker(total * 7 + 3), source: 'auto',
    note: `Perfect round — ${total}/${total}!`, dedupeKey: `perfect:${sessionId}`,
  });
  return created ? sticker : null;
}

// Mastering a skill — awarded once per skill.
export async function awardMasterySticker({ studentId, skillId }) {
  if (!studentId || !skillId) return null;
  const seed = [...String(skillId)].reduce((s, c) => s + c.charCodeAt(0), 0);
  const { sticker, created } = await awardSticker({
    studentId, stickerCode: pickAutoSticker(seed), source: 'auto',
    note: 'Skill mastered!', dedupeKey: `mastery:${skillId}`,
  });
  return created ? sticker : null;
}

// Hitting the fluency goal on a fluency session (once per session).
export async function awardFluencySticker({ studentId, sessionId, accuracy, threshold = 80 }) {
  if (!studentId || !sessionId || !Number.isFinite(accuracy) || accuracy < threshold) return null;
  const { sticker, created } = await awardSticker({
    studentId, stickerCode: pickAutoSticker(Math.round(accuracy) + 11), source: 'auto',
    note: `Fluency goal — ${Math.round(accuracy)}%!`, dedupeKey: `fluency:${sessionId}`,
  });
  return created ? sticker : null;
}
