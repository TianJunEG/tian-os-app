import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { partnersAPI } from '../services/api';
import { GROUP_NAME, SERVICES } from '../config/brand';

function PartnershipSection() {
  const [form, setForm] = useState({ name: '', organization: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      await partnersAPI.submitInquiry(form);
      setStatus('success');
      setForm({ name: '', organization: '', email: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your inquiry. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section className="mt-20 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Partnerships</h2>
        <p className="text-gray-600 mb-6">
          We're not formally launching partnerships yet, but we'd love to hear from schools,
          educators, and organizations interested in working with {GROUP_NAME}. Tell us a little
          about you and we'll reach out when the time is right.
        </p>

        {status === 'success' ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            Thank you for your interest. Our team will be in touch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  maxLength={150}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How would you like to partner?</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
            >
              {status === 'submitting' ? 'Submitting...' : 'Express Interest'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function GroupLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-purple-600">{GROUP_NAME}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Empowering learners across every stage
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {GROUP_NAME} brings together a family of education services. Choose a service to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {SERVICES.map((service) => {
            const card = (
              <div
                className={`h-full bg-white rounded-xl shadow p-8 transition ${
                  service.available ? 'hover:shadow-lg cursor-pointer' : 'opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                  {!service.available && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-1 rounded">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{service.tagline}</p>
                {service.available && (
                  <p className="mt-4 text-purple-600 font-medium">Explore →</p>
                )}
              </div>
            );

            return service.available ? (
              <Link key={service.id} to={service.path}>
                {card}
              </Link>
            ) : (
              <div key={service.id}>{card}</div>
            );
          })}
        </div>

        <PartnershipSection />
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} {GROUP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
