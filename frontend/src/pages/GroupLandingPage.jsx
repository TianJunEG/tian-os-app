import React from 'react';
import { Link } from 'react-router-dom';
import { GROUP_NAME, SERVICES } from '../config/brand';

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
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} {GROUP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
