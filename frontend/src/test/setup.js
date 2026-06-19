import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom doesn't implement scrollIntoView — stub it globally so tests that
// trigger smooth-scroll code (e.g. FractionAnswerInput) don't throw.
window.HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => cleanup());
