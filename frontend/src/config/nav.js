// Modern navigation: generated from a central, version-aware catalog.
import { buildNav } from './navigationConfig';
import FEATURE_FLAGS from './featureFlags';
import VERSION from './version';

const roles = ['student', 'parent', 'tutor', 'teacher', 'admin'];
const showDisabled = import.meta.env.VITE_SHOW_DISABLED === '1' || import.meta.env.VITE_SHOW_DISABLED === 'true';
export const NAV = roles.reduce((acc, r) => ({
  ...acc,
  [r]: buildNav({ version: VERSION, featureFlags: FEATURE_FLAGS, role: r, showDisabled }),
}), {});

export const ROLE_HOME = {
  student: '/student', parent: '/parent', tutor: '/tutor', teacher: '/teacher', admin: '/admin',
};
