import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { partnersAPI } from '../services/api';
import { GROUP_NAME, SERVICES } from '../config/brand';
import Seo from '../components/Seo';

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner with us</h2>
        <p className="text-gray-600 mb-6">
          {GROUP_NAME} is building a connected family of education services, and the best ones are
          built together. We're not formally opening partnerships yet, but we're already talking
          with the schools, educators, and organizations who want to help shape what comes next. If
          that sounds like you, introduce yourself, and we'll reach out as opportunities open up.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg bg-purple-50 p-4">
            <h3 className="font-semibold text-gray-900 mb-1">Schools &amp; institutions</h3>
            <p className="text-sm text-gray-600">Bring vetted tutoring and learning tools to your students.</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <h3 className="font-semibold text-gray-900 mb-1">Educators &amp; creators</h3>
            <p className="text-sm text-gray-600">Grow your reach and build alongside our services.</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <h3 className="font-semibold text-gray-900 mb-1">Organizations</h3>
            <p className="text-sm text-gray-600">Expand learning access through community programs.</p>
          </div>
        </div>

        {status === 'success' ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            Thanks for reaching out. We've received your details and will be in touch as
            partnership opportunities open up.
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
                <label htmlFor="partner-name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  id="partner-name"
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
                <label htmlFor="partner-org" className="block text-sm font-medium text-gray-700 mb-2">
                  Organization <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="partner-org"
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
              <label htmlFor="partner-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                id="partner-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="partner-message" className="block text-sm font-medium text-gray-700 mb-2">Tell us how you'd like to work together</label>
              <textarea
                id="partner-message"
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
              {status === 'submitting' ? 'Sending...' : 'Get in touch'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section className="mt-20 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-block text-xs font-semibold uppercase tracking-wide text-purple-700 bg-purple-100 px-3 py-1 rounded mb-4">
          A social enterprise
        </span>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Education that gives back</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {GROUP_NAME} is being established as a social enterprise — a business built to create
          opportunity, not just returns. Every service we run is designed to lift the people who
          need it most and to keep great teaching in the hands of those who do it best.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Investing in at-risk youth</h3>
          <p className="text-gray-600">
            We support young people facing barriers to education. As they grow and achieve strong
            results, we train and mentor them to become tutors themselves — turning their own
            progress into a livelihood, and into a role model for the next student coming up behind
            them.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Honouring experienced educators</h3>
          <p className="text-gray-600">
            We bring retired teachers back into education as consultants and tutors. Decades of
            classroom wisdom shouldn't retire with them — instead it guides our students, mentors
            our newest tutors, and shapes how every service is built.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Inclusive employment</h3>
          <p className="text-gray-600">
            We hire persons with disabilities across our team — in roles like marketing, customer
            service, and operations. Meaningful work and the right support unlock real talent, and
            building an inclusive workplace makes everything we do stronger.
          </p>
        </div>
      </div>

      <p className="text-center text-gray-600 mt-8 max-w-3xl mx-auto">
        The result is a cycle that compounds: experienced teachers raise up young learners, those
        learners become tutors, and an inclusive team powers it all — so the impact grows with
        every student we reach and every person we employ.
      </p>
    </section>
  );
}

export default function GroupLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Seo
        description={`${GROUP_NAME} is a social enterprise bringing together a family of education services — tutor matching, learning resources, and more.`}
        path="/"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">{GROUP_NAME}</h1>
          <Link to="/resources" className="text-gray-700 hover:text-purple-600 font-medium">
            Resources
          </Link>
        </div>
      </header>

      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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

        <MissionSection />

        <PartnershipSection />
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} {GROUP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
