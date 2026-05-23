import React from 'react';
import { Link } from 'react-router-dom';
import { GROUP_NAME } from '../config/brand';
import Seo from '../components/Seo';

export default function TutoringLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Seo
        title="Tutor Matching"
        description="Connect with expert, vetted tutors and start learning today — Tutor Matching, a service of Tian Jun Education Group."
        path="/tutoring"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-purple-600">Tutor Matching</h1>
              <Link to="/" className="text-xs text-gray-500 hover:text-purple-600">
                A {GROUP_NAME} service
              </Link>
            </div>
            <div className="space-x-4">
              <a href="/login" className="text-gray-700 hover:text-purple-600 font-medium">
                Login
              </a>
              <a href="/register" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </header>

      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Tutor</h2>
          <p className="text-xl text-gray-600 mb-8">
            Connect with expert tutors and start learning today
          </p>
          <div className="space-x-4">
            <a
              href="/register?role=parent"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-block font-medium"
            >
              Find a Tutor
            </a>
            <a
              href="/register?role=tutor"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block font-medium"
            >
              Become a Tutor
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
