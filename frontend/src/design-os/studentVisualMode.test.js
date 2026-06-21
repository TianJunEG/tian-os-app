import { describe, it, expect } from 'vitest';
import { resolveStudentVisualMode, STUDENT_VISUAL_MODES } from './studentVisualMode';

const { LOWER_PRIMARY, UPPER_PRIMARY, SECONDARY } = STUDENT_VISUAL_MODES;

describe('resolveStudentVisualMode', () => {
  it('routes kindergarten levels to the lower-primary skin', () => {
    // Regression: "K2" previously fell through to upper-primary, so the
    // kindergarten dashboard (gated inside the lower-primary view) was unreachable.
    for (const level of ['K2', 'k2', 'K1', 'Kindergarten', 'kindy', 'Preschool', 'Nursery']) {
      expect(resolveStudentVisualMode({ studentLevel: level }), level).toBe(LOWER_PRIMARY);
    }
  });

  it('routes P1–P3 to lower-primary and P4–P6 to upper-primary', () => {
    for (const level of ['P1', 'Primary 2', 'P3']) {
      expect(resolveStudentVisualMode({ studentLevel: level }), level).toBe(LOWER_PRIMARY);
    }
    for (const level of ['P4', 'Primary 5', 'P6']) {
      expect(resolveStudentVisualMode({ studentLevel: level }), level).toBe(UPPER_PRIMARY);
    }
  });

  it('routes secondary levels to the secondary skin', () => {
    expect(resolveStudentVisualMode({ studentLevel: 'Secondary 1' })).toBe(SECONDARY);
    expect(resolveStudentVisualMode({ studentLevel: 'S3' })).toBe(SECONDARY);
  });

  it('honours an explicit visualMode over the derived level', () => {
    expect(resolveStudentVisualMode({ visualMode: LOWER_PRIMARY, studentLevel: 'P6' })).toBe(LOWER_PRIMARY);
  });

  it('defaults to upper-primary when the level is unknown/blank', () => {
    expect(resolveStudentVisualMode({})).toBe(UPPER_PRIMARY);
    expect(resolveStudentVisualMode({ studentLevel: '' })).toBe(UPPER_PRIMARY);
  });
});
