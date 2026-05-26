import { Link } from 'react-router-dom';

// Minimal Edu OS public header used by content pages (resources hub/detail).
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-navy-900 grid place-items-center text-gold-400 font-extrabold">E</span>
          <span className="text-lg font-extrabold text-navy-900 tracking-tight">
            Edu<span className="text-gold-500">OS</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-gray-700">
          <Link to="/resources" className="hover:text-navy-900">Resources</Link>
          <Link to="/login" className="px-3 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800">
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
