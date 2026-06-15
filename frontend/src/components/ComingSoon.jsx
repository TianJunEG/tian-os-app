import React from 'react';
import { Link } from 'react-router-dom';

export default function ComingSoon({ feature }) {
  const title = feature ? `${feature.charAt(0).toUpperCase() + feature.slice(1)} — Coming Soon` : 'Coming Soon';
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl text-center">
        <h1 className="text-2xl font-semibold mb-3">{title}</h1>
        <p className="text-ink-500 mb-6">This feature is on our roadmap and will be available in a future release.</p>
        <Link to="/student" className="inline-block px-5 py-3 bg-emerald-deep text-white rounded-md">Back to dashboard</Link>
      </div>
    </div>
  );
}
