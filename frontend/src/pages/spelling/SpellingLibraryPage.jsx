import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Copy, Eye, Library as LibraryIcon, Loader2 } from 'lucide-react';
import SpellingHeader from '../../components/spelling/SpellingHeader';
import { spellingAPI } from '../../services/api';

const LEVELS = [['', 'All levels'], ['P1', 'Primary 1'], ['P2', 'Primary 2'], ['P3', 'Primary 3'], ['P4', 'Primary 4'], ['P5', 'Primary 5'], ['P6', 'Primary 6'], ['other', 'Other']];

export default function SpellingLibraryPage() {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [level, setLevel] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState(null);

  const load = () => {
    setLoading(true);
    spellingAPI
      .getLibrary({ level: level || undefined, q: q || undefined })
      .then((r) => setLists(r.data.lists || []))
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  };

  // Reload when the level filter changes.
  useEffect(load, [level]);

  const copy = async (id) => {
    setCopyingId(id);
    try {
      const res = await spellingAPI.copyList(id);
      navigate(`/spelling/lists/${res.data.list._id}`);
    } catch {
      alert('Could not copy this list.');
      setCopyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader title="Shared library" subtitle="Spelling lists shared by other users" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
            className="flex-1 relative"
          >
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title…"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:border-navy-500 outline-none"
            />
          </form>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:border-navy-500 outline-none">
            {LEVELS.map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading…</p>
        ) : lists.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <LibraryIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No shared lists found. Try a different level or search.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
              <div key={list._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{list.title}</h3>
                {list.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{list.description}</p>}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <span className="px-2 py-0.5 bg-navy-50 text-navy-700 rounded">{LEVELS.find(([v]) => v === list.level)?.[1] || 'Other'}</span>
                  <span>{list.words?.length || 0} words</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">by {list.owner?.name || 'Unknown'}{list.copyCount ? ` · ${list.copyCount} copies` : ''}</p>
                <div className="mt-auto flex gap-2">
                  <button onClick={() => navigate(`/spelling/lists/${list._id}`)} className="flex-1 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <button onClick={() => copy(list._id)} disabled={copyingId === list._id} className="flex-1 py-2 text-sm bg-navy-600 text-white rounded-lg hover:bg-navy-700 disabled:opacity-50 inline-flex items-center justify-center gap-1">
                    {copyingId === list._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />} Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
