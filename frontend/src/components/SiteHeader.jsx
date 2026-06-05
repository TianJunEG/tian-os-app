import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { GROUP_NAME, GROUP_SHORT } from '../config/brand';

const navLinks = [
  { to: '/tutoring', label: 'Tutoring' },
  { to: '/edu-apps', label: 'Edu Apps' },
  { to: '/resources', label: 'Resources' },
  { to: '/methodology', label: 'Our Methodology' },
];

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive ? 'text-navy-700' : 'text-slate-600 hover:text-navy-700'
  }`;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display font-semibold text-slate-900">
              <span className="sm:hidden">{GROUP_SHORT}</span>
              <span className="hidden sm:inline">{GROUP_NAME}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-navy-700">
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            className="p-2 text-slate-700 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              {l.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg bg-navy-600 px-4 py-2 text-center text-sm font-semibold text-white"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
