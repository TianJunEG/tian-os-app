import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListChecks,
  Library,
  Upload,
  Sparkles,
  AlertTriangle,
  Plus,
  TrendingUp
} from 'lucide-react';
import SpellingHeader from '../../components/spelling/SpellingHeader';
import { spellingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Tile = ({ icon: Icon, title, desc, color, onClick }) => (
  <button
    onClick={onClick}
    className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition text-left flex flex-col gap-2 border border-gray-100"
  >
    <span className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </span>
    <h3 className="font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500">{desc}</p>
  </button>
);

export default function SpellingHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [listCount, setListCount] = useState(null);

  useEffect(() => {
    spellingAPI.getStats().then((r) => setStats(r.data)).catch(() => {});
    spellingAPI.getLists().then((r) => setListCount(r.data.count)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader title="Spelling" subtitle={`Hi ${user?.name || 'there'}!`} backTo="/dashboard" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {stats && stats.total > 0 && (
          <div className="mb-6 p-4 bg-white rounded-xl shadow-sm flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-gray-700">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">{stats.accuracy}%</span> accuracy
            </div>
            <div className="text-sm text-gray-500">{stats.total} words practised</div>
            {stats.trickyWords?.length > 0 && (
              <div className="text-sm text-gray-500">
                Tricky words:{' '}
                {stats.trickyWords.slice(0, 5).map((w) => (
                  <span key={w.word} className="font-medium text-gray-700">
                    {w.word}{' '}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Tile
            icon={ListChecks}
            title="My lists"
            desc={listCount != null ? `${listCount} list(s) — practise & test` : 'Your spelling lists'}
            color="bg-purple-600"
            onClick={() => navigate('/spelling/lists')}
          />
          <Tile
            icon={Plus}
            title="New list"
            desc="Type words or upload a file/photo"
            color="bg-green-600"
            onClick={() => navigate('/spelling/lists/new')}
          />
          <Tile
            icon={Library}
            title="Library"
            desc="Browse lists shared by others"
            color="bg-blue-600"
            onClick={() => navigate('/spelling/library')}
          />
          <Tile
            icon={AlertTriangle}
            title="Commonly misspelt"
            desc="Tricky words by difficulty"
            color="bg-amber-500"
            onClick={() => navigate('/spelling/misspelt')}
          />
          <Tile
            icon={Sparkles}
            title="Surprise spelling"
            desc="Random words from your lists"
            color="bg-pink-500"
            onClick={() => navigate('/spelling/surprise')}
          />
          <Tile
            icon={Upload}
            title="Upload a list"
            desc="PDF, Word, photo or text"
            color="bg-indigo-600"
            onClick={() => navigate('/spelling/lists/new?upload=1')}
          />
        </div>
      </main>
    </div>
  );
}
