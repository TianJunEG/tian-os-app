import { describe, it, expect } from 'vitest';
import {
  STICKERS,
  STICKER_GOAL_SIZE,
  isValidStickerCode,
  pickAutoSticker,
  AUTO_STICKER_POOL,
  stickerChartProgress,
} from './stickerCatalog.js';

describe('sticker catalog', () => {
  it('every sticker has a unique code, label and image path', () => {
    const codes = STICKERS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const s of STICKERS) {
      expect(s.code).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.image).toMatch(/^\/(stickers|mascots)\/.+\.png$/);
    }
  });

  it('validates codes against the catalog', () => {
    expect(isValidStickerCode('trophy')).toBe(true);
    expect(isValidStickerCode('kaesy-cheer')).toBe(true);
    expect(isValidStickerCode('not-a-sticker')).toBe(false);
    expect(isValidStickerCode('')).toBe(false);
    expect(isValidStickerCode(undefined)).toBe(false);
  });

  it('auto pool references only real catalog codes and rotates deterministically', () => {
    for (const code of AUTO_STICKER_POOL) expect(isValidStickerCode(code)).toBe(true);
    expect(pickAutoSticker(0)).toBe(AUTO_STICKER_POOL[0]);
    expect(pickAutoSticker(AUTO_STICKER_POOL.length)).toBe(AUTO_STICKER_POOL[0]); // wraps
    expect(isValidStickerCode(pickAutoSticker(123))).toBe(true);
  });
});

describe('stickerChartProgress', () => {
  it('reports filled/remaining within the current chart', () => {
    expect(stickerChartProgress(0)).toMatchObject({ completedCharts: 0, filledInCurrent: 0, remaining: STICKER_GOAL_SIZE, justCompleted: false });
    expect(stickerChartProgress(3)).toMatchObject({ completedCharts: 0, filledInCurrent: 3, remaining: STICKER_GOAL_SIZE - 3 });
  });

  it('rolls a completed chart over and flags the moment it completes', () => {
    expect(stickerChartProgress(STICKER_GOAL_SIZE)).toMatchObject({ completedCharts: 1, filledInCurrent: 0, justCompleted: true });
    expect(stickerChartProgress(STICKER_GOAL_SIZE + 2)).toMatchObject({ completedCharts: 1, filledInCurrent: 2, justCompleted: false });
  });

  it('coerces junk input to a safe zero progress', () => {
    expect(stickerChartProgress(-5)).toMatchObject({ total: 0, completedCharts: 0, filledInCurrent: 0 });
    expect(stickerChartProgress('nope')).toMatchObject({ total: 0 });
  });
});
