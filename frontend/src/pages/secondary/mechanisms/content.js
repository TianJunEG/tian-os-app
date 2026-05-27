// Content model for the Mechanisms Playground (Tian OS → Secondary → D&T).
// Pure data: learning objectives, key concepts, prediction prompts, common
// misconceptions, concept-check questions and teacher discussion prompts for
// each mechanism. The live simulation maths lives in the sim components; this
// file keeps the pedagogy editable in one place.

import { Cog, Scale, CircleDot, GitFork } from 'lucide-react';

export const MECHANISMS = {
  gears: {
    key: 'gears',
    name: 'Gears',
    icon: Cog,
    blurb: 'Toothed wheels that mesh to transmit rotation, changing speed, direction and turning force.',
    objective: 'Explain how gear size changes the speed, direction and turning force of a driven gear.',
    keyConcepts: [
      'Driver gear', 'Driven gear', 'Direction of rotation', 'Gear size',
      'Speed', 'Turning force (torque)', 'Gear trains',
    ],
    misconceptions: [
      'All meshed gears turn in the same direction.',
      'Bigger gears always move faster.',
    ],
    discussionPrompt: 'A bicycle climbs a hill in a low gear. Which gear is the driver, which is the driven, and why does the rider pedal more times for each turn of the wheel?',
  },
  levers: {
    key: 'levers',
    name: 'Levers',
    icon: Scale,
    blurb: 'A rigid bar pivoting about a fulcrum. Position of effort, load and fulcrum sets the mechanical advantage.',
    objective: 'Identify the three classes of lever and explain how fulcrum position changes the effort needed.',
    keyConcepts: [
      'Effort', 'Load', 'Fulcrum', 'Distance from fulcrum',
      'Mechanical advantage', 'First, second & third class levers',
    ],
    misconceptions: [
      'The same effort is always needed regardless of fulcrum position.',
    ],
    discussionPrompt: 'Compare a wheelbarrow (class 2) with a pair of tweezers (class 3). Which gives a mechanical advantage, which gives a speed advantage, and where is the fulcrum in each?',
  },
  pulleys: {
    key: 'pulleys',
    name: 'Pulleys',
    icon: CircleDot,
    blurb: 'Grooved wheels and rope that change the direction of effort and multiply lifting force.',
    objective: 'Explain how fixed and movable pulleys change the direction and size of the effort needed.',
    keyConcepts: [
      'Fixed pulley', 'Movable pulley', 'Direction of force',
      'Load', 'Effort', 'Mechanical advantage',
    ],
    misconceptions: [
      'A fixed pulley always makes the load easier to lift.',
      'More ropes always mean less effort with no trade-off.',
    ],
    discussionPrompt: 'A movable pulley halves the effort to lift a load. What is the trade-off, and why can energy never be created by adding more pulleys?',
  },
  linkages: {
    key: 'linkages',
    name: 'Linkages',
    icon: GitFork,
    blurb: 'Bars and pivots that change the size, direction or path of motion between an input and an output.',
    objective: 'Describe how links and pivots transfer input motion into a different output motion.',
    keyConcepts: [
      'Input motion', 'Output motion', 'Pivot',
      'Link', 'Direction of movement', 'Motion transfer',
    ],
    misconceptions: [
      'Linkages only move in one fixed way.',
      'Input and output motion are always the same.',
    ],
    discussionPrompt: 'A car engine turns the up-and-down motion of a piston into rotation. Which linkage does this, and what role do the pivots play in transferring the motion?',
  },
};

export const MECHANISM_ORDER = ['gears', 'levers', 'pulleys', 'linkages'];

export function getMechanism(key) {
  return MECHANISMS[key];
}
