import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { GROUP_NAME, GROUP_SHORT } from '../config/brand';

const navLinks = [
  { to: '/edu-apps', label: 'Platform' },
  { to: '/methodology', label: 'Our Approach' },
  { to: '/resources', label: 'Resources' },
];

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive ? 'text-emerald-deep' : 'text-body-soft hover:text-emerald-deep'
  }`;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display font-semibold text-ink">
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
            <Link to="/login" className="text-sm font-medium text-body-soft hover:text-emerald-deep">
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-lg bg-emerald px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-deep"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            className="p-2 text-body md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-1 border-t border-line bg-white px-4 py-4 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2 font-medium text-body hover:bg-surface-raised"
            >
              {l.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-line-strong px-4 py-2 text-center text-sm font-medium text-body"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg bg-emerald px-4 py-2 text-center text-sm font-semibold text-white"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
