import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, SpellCheck, Volume2, VolumeX } from 'lucide-react';
import { isMuted, setMuted } from '../../utils/sound';

// Consistent top bar for every spelling screen. `backTo` controls where the
// back arrow goes (defaults to the spelling hub).
export default function SpellingHeader({ title, subtitle, backTo = '/spelling', right = null }) {
  const navigate = useNavigate();
  const [muted, setMutedState] = useState(isMuted());
  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };
  return (
    <header className="bg-white shadow sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(backTo)}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-purple-600">
          <SpellCheck className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
        </div>
        {right}
        <button
          onClick={toggleSound}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          title={muted ? 'Sounds off' : 'Sounds on'}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          aria-label="Dashboard"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
