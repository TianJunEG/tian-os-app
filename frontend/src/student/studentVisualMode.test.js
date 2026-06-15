import { describe, expect, it } from 'vitest';
import { resolveStudentVisualMode, STUDENT_VISUAL_MODES } from '../design-os/studentVisualMode';

describe('student visual mode resolver', () => {
  it('uses an explicit valid studentVisualMode first', () => {
    expect(resolveStudentVisualMode({ studentVisualMode: 'secondary', level: 'Primary 2' })).toBe('secondary');
  });

  it('defaults lower primary students to lower_primary', () => {
    expect(resolveStudentVisualMode({ level: 'Primary 1' })).toBe(STUDENT_VISUAL_MODES.LOWER_PRIMARY);
    expect(resolveStudentVisualMode({ level: 'P3' })).toBe(STUDENT_VISUAL_MODES.LOWER_PRIMARY);
  });

  it('defaults upper primary students to upper_primary', () => {
    expect(resolveStudentVisualMode({ level: 'Primary 4' })).toBe(STUDENT_VISUAL_MODES.UPPER_PRIMARY);
    expect(resolveStudentVisualMode({ level: 'P5' })).toBe(STUDENT_VISUAL_MODES.UPPER_PRIMARY);
    expect(resolveStudentVisualMode({ level: 'P6' })).toBe(STUDENT_VISUAL_MODES.UPPER_PRIMARY);
  });

  it('defaults secondary students to secondary', () => {
    expect(resolveStudentVisualMode({ level: 'Secondary 1' })).toBe(STUDENT_VISUAL_MODES.SECONDARY);
    expect(resolveStudentVisualMode({ level: 'Sec 3' })).toBe(STUDENT_VISUAL_MODES.SECONDARY);
  });

  it('falls back safely to upper_primary when missing', () => {
    expect(resolveStudentVisualMode({})).toBe(STUDENT_VISUAL_MODES.UPPER_PRIMARY);
  });
});
