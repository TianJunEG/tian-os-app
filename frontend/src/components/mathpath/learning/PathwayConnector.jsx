import React from 'react';

export default function PathwayConnector({ orientation = 'vertical', className = '' }) {
  if (orientation === 'horizontal') {
    return <span aria-hidden className={`block h-px w-full bg-line-soft ${className}`} />;
  }
  return <span aria-hidden className={`block h-full w-px bg-line-soft ${className}`} />;
}
