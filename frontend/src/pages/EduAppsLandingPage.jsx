import React from 'react';
import { Link } from 'react-router-dom';
import { GROUP_NAME } from '../config/brand';
import Seo from '../components/Seo';

export default function EduAppsLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Seo
        title="Edu Apps"
        description="Interactive learning apps for every student — coming soon from Tian Jun Education Group."
        path="/edu-apps"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-purple-600">Edu Apps</h1>
            <Link to="/" className="text-xs text-gray-500 hover:text-purple-600">
              A {GROUP_NAME} service
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-3 py-1 rounded mb-6">
            Coming soon
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Interactive learning apps for every student
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We're building a suite of educational apps under {GROUP_NAME}. Check back soon.
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-block font-medium"
          >
            ← Back to {GROUP_NAME}
          </Link>
        </div>
      </main>
    </div>
  );
}
