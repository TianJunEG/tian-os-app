import React from 'react';
import { Badge } from '../ui';

// The canonical competency list now comes from the server (GET /lifelab/competencies,
// sourced from E21CC_COMPETENCIES in models/LifeLabActivity.js) — fetch it where a
// picker is needed rather than hardcoding it here.

// E21CC chips for a LifeLab activity. Primary (the focus) reads as a solid gold
// badge; secondary (also exercised) as a lighter outline badge.
export default function E21ccTags({ primary = [], secondary = [], className = '' }) {
  if (!primary.length && !secondary.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {primary.map((t) => <Badge key={t} tone="gold">{t}</Badge>)}
      {secondary.map((t) => <Badge key={t} tone="outline">{t}</Badge>)}
    </div>
  );
}
