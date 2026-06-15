import React from 'react';

export default function LearningPathwayShell({ children, className = '' }) {
  return (
    <section className={`mx-auto w-full max-w-6xl overflow-x-hidden pb-24 md:pb-10 ${className}`}>
      {children}
    </section>
  );
}
