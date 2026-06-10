// Backend feature flags and version settings for Tian OS
export const TIANOS_VERSION = process.env.TIANOS_VERSION || 'v0.1';

export const FLAGS = {
  // core student features
  mathpath: true,
  fluency: true,
  mistakes: true,
  progress: true,

  // optional features (enable via env FEAT_* = '1')
  worksheets: process.env.FEAT_WORKSHEETS !== '0',
  parent: process.env.FEAT_PARENT !== '0',
  tutor: process.env.FEAT_TUTOR === '1',
  teacher: process.env.FEAT_TEACHER === '1',
  lifelab: process.env.FEAT_LIFELAB === '1',
  science: process.env.FEAT_SCIENCE === '1',
  mechanisms: process.env.FEAT_MECHANISMS === '1',
  spelling: process.env.FEAT_SPELLING === '1',
  psl: process.env.FEAT_PSL === '1',
  admin: true,
};

export default { TIANOS_VERSION, FLAGS };
