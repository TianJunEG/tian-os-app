import React from 'react';

export default function PathwayConnector({ orientation = 'vertical', className = '' }) {
  if (orientation === 'horizontal') {
    return <span aria-hidden className={`block h-px w-full bg-hairline ${className}`} />;
  }
  return <span aria-hidden className={`block h-full w-px bg-hairline ${className}`} />;
}
