import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const studentPagesRoot = dirname;

function collectStudentSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectStudentSourceFiles(fullPath);
    if (!/\.(jsx|js)$/.test(entry.name)) return [];
    if (/\.test\.(jsx|js)$/.test(entry.name)) return [];
    return [fullPath];
  });
}

describe('student pilot copy guard', () => {
  it('does not expose developer seed or fake/demo copy in student page source', () => {
    const forbidden = [
      /Run npm run/i,
      /No questions seeded yet/i,
      /Not seeded yet/i,
      /demo-student/i,
      /fake mistakes/i,
      /fake activity/i,
      /Route not found/i,
    ];

    const violations = collectStudentSourceFiles(studentPagesRoot).flatMap((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      return forbidden
        .filter((pattern) => pattern.test(source))
        .map((pattern) => `${path.relative(studentPagesRoot, filePath)}: ${pattern}`);
    });

    expect(violations).toEqual([]);
  });
});
