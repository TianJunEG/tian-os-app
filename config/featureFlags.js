// Backend feature flags and version settings for Tian OS
export const TIANOS_VERSION = process.env.TIANOS_VERSION || 'v0.1';

export const FLAGS = {
  // core student features
  mathpath: true,
  decimals: process.env.FEAT_DECIMALS !== '0',
  percentages: process.env.FEAT_PERCENTAGES !== '0',
  ratioRate: process.env.FEAT_RATIO_RATE !== '0',
  operations: process.env.FEAT_OPERATIONS !== '0',
  numberSense: process.env.FEAT_NUMBER_SENSE !== '0',
  money: process.env.FEAT_MONEY !== '0',
  time: process.env.FEAT_TIME_DOMAIN !== '0',
  measurement: process.env.FEAT_MEASUREMENT !== '0',
  geometry: process.env.FEAT_GEOMETRY !== '0',
  areaPerimeter: process.env.FEAT_AREA_PERIMETER !== '0',
  circles: process.env.FEAT_CIRCLES !== '0',
  volume: process.env.FEAT_VOLUME !== '0',
  statistics: process.env.FEAT_STATISTICS !== '0',
  algebra: process.env.FEAT_ALGEBRA !== '0',
  fluency: true,
  mistakes: true,
  progress: true,

  // optional features (enable via env FEAT_* = '1')
  worksheets: process.env.FEAT_WORKSHEETS !== '0',
  parent: process.env.FEAT_PARENT !== '0',
  tutor: process.env.FEAT_TUTOR !== '0',
  teacher: process.env.FEAT_TEACHER !== '0',
  lifelab: process.env.FEAT_LIFELAB !== '0',
  science: process.env.FEAT_SCIENCE === '1',
  mechanisms: process.env.FEAT_MECHANISMS === '1',
  spelling: process.env.FEAT_SPELLING !== '0',
  comics: process.env.FEAT_COMICS !== '0',
  psl: process.env.FEAT_PSL !== '0',
  comics: process.env.FEAT_COMICS !== '0',
  admin: true,
};

export default { TIANOS_VERSION, FLAGS };
