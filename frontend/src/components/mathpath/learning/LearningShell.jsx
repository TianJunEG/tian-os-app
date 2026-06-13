import React from 'react';

export default function LearningShell({ children, className = '' }) {
  return (
    <section className={`mx-auto w-full max-w-2xl overflow-x-hidden pb-24 md:pb-10 ${className}`}>
      {children}
    </section>
  );
}
