import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Share2, Lock, BookOpen, Pencil } from 'lucide-react';
import SpellingHeader from '../../components/spelling/SpellingHeader';
import { spellingAPI } from '../../services/api';

const LEVEL_LABELS = { P1: 'Primary 1', P2: 'Primary 2', P3: 'Primary 3', P4: 'Primary 4', P5: 'Primary 5', P6: 'Primary 6', other: 'Other' };

export default function SpellingListsPage() {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    spellingAPI
      .getLists()
      .then((r) => setLists(r.data.lists || []))
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await spellingAPI.deleteList(id);
      setLists((l) => l.filter((x) => x._id !== id));
    } catch {
      alert('Could not delete the list.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader
        title="My spelling lists"
        right={
          <button
            onClick={() => navigate('/spelling/lists/new')}
            className="px-3 min-h-[44px] bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm inline-flex items-center justify-center gap-1"
            aria-label="New list"
            title="New list"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New</span>
          </button>
        }
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading…</p>
        ) : lists.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">You don't have any spelling lists yet.</p>
            <button
              onClick={() => navigate('/spelling/lists/new')}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Create your first list
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {lists.map((list) => (
              <div key={list._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden">
                <button onClick={() => navigate(`/spelling/lists/${list._id}`)} className="w-full text-left p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 flex-1 truncate">{list.title}</h3>
                    {list.isShared ? (
                      <span title="Shared" className="text-blue-500"><Share2 className="w-4 h-4" /></span>
                    ) : (
                      <span title="Private" className="text-gray-300"><Lock className="w-4 h-4" /></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">{LEVEL_LABELS[list.level] || 'Other'}</span>
                    <span>{list.words?.length || 0} words</span>
                  </div>
                </button>
                <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                  <button onClick={() => navigate(`/spelling/lists/${list._id}`)} className="flex-1 py-2 text-sm text-purple-600 hover:bg-purple-50 inline-flex items-center justify-center gap-1">
                    <BookOpen className="w-4 h-4" /> Practise
                  </button>
                  <button onClick={() => navigate(`/spelling/lists/${list._id}/edit`)} className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-50 inline-flex items-center justify-center gap-1">
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => remove(list._id, list.title)} className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 inline-flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
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
