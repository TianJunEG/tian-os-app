import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { GROUP_NAME } from '../config/brand';

export default function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-semibold text-white">{GROUP_NAME}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              A social enterprise bringing together a family of education services — built to create
              opportunity through learning.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Services</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link className="transition hover:text-white" to="/tutoring">Tutor Matching</Link></li>
              <li><Link className="transition hover:text-white" to="/edu-apps">Edu Apps</Link></li>
              <li><Link className="transition hover:text-white" to="/resources">Resources</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Get started</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link className="transition hover:text-white" to="/register">Create an account</Link></li>
              <li><Link className="transition hover:text-white" to="/login">Sign in</Link></li>
              <li><Link className="transition hover:text-white" to="/#partner">Partner with us</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} {GROUP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
