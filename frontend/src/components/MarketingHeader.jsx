import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV = [
  { to: '/our-story', label: 'Our Story' },
  { to: '/', label: 'Platform' },
  { to: '/resources', label: 'Resources' },
];

function LogoTile() {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
      background: 'linear-gradient(135deg, #5d86f0, #8fb1ff)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Newsreader', serif", fontWeight: 600, color: '#0e1a31', fontSize: 17,
    }}>T</div>
  );
}

export default function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header style={{ position: 'relative', zIndex: 20 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '30px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
          <LogoTile />
          <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em', color: '#f4f0e8' }}>
            Tian OS
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 30, fontSize: 14.5 }} className="hidden md:flex">
          {NAV.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              style={({ isActive }) => ({
                color: isActive ? '#f4f0e8' : '#aebbd2',
                textDecoration: 'none',
                transition: 'color .15s',
              })}
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/register"
            style={{
              border: '1px solid rgba(255,255,255,0.18)', padding: '9px 18px',
              borderRadius: 999, color: '#f4f0e8', textDecoration: 'none',
              whiteSpace: 'nowrap', fontSize: 14.5, transition: 'border-color .15s',
            }}
          >
            Get started
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aebbd2', padding: 8 }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#13223e', borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '16px 40px 24px',
        }}>
          {NAV.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              style={{ display: 'block', color: '#f4f0e8', textDecoration: 'none', padding: '10px 0', fontSize: 15 }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            style={{
              display: 'inline-block', marginTop: 12,
              border: '1px solid rgba(255,255,255,0.22)', padding: '10px 20px',
              borderRadius: 999, color: '#f4f0e8', textDecoration: 'none', fontSize: 14.5,
            }}
          >
            Get started
          </Link>
        </div>
      )}
    </header>
  );
}
