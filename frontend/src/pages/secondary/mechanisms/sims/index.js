// Registry mapping a mechanism key to its simulator component. Adding a new
// mechanism is a one-line change here plus an entry in content.js.
import GearsSim from './GearsSim.jsx';
import LeversSim from './LeversSim.jsx';
import PulleysSim from './PulleysSim.jsx';
import LinkagesSim from './LinkagesSim.jsx';

export const SIMS = {
  gears: GearsSim,
  levers: LeversSim,
  pulleys: PulleysSim,
  linkages: LinkagesSim,
};
