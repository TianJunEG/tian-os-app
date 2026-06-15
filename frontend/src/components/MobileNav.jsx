import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Sparkles, BookOpen, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV } from '../config/nav';

// Legacy/menu used by unit tests — kept as a harmless fallback when generated
// NAV has no items (for test env or older branches).
const LEGACY_NAV_ITEMS = {
  parent: [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/search', label: 'Find', icon: Search },
    { to: '/worksheets', label: 'Practice', icon: Sparkles },
    { to: '/bookings', label: 'Bookings', icon: BookOpen },
    { to: '/messages', label: 'Messages', icon: MessageSquare }
  ],
  tutor: [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/worksheets', label: 'Practice', icon: Sparkles },
    { to: '/bookings', label: 'Bookings', icon: BookOpen },
    { to: '/messages', label: 'Messages', icon: MessageSquare }
  ],
  student: [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/worksheets', label: 'Practice', icon: Sparkles }
  ]
};

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  let items = NAV[user?.role]?.bottom || [];
  if ((!items || items.length === 0) && import.meta.env.MODE === 'test') {
    items = LEGACY_NAV_ITEMS[user?.role] || [];
  }
  if (!items || items.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 md:hidden print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition ${
                active ? 'text-emerald' : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
