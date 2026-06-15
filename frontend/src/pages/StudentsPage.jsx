import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Trash2, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentsAPI } from '../services/api';

const STUDENT_LEVELS = [
  { value: 'P1', label: 'Primary 1' },
  { value: 'P2', label: 'Primary 2' },
  { value: 'P3', label: 'Primary 3' },
  { value: 'P4', label: 'Primary 4' },
  { value: 'P5', label: 'Primary 5' },
  { value: 'P6', label: 'Primary 6' },
  { value: 'S1', label: 'Secondary 1' },
  { value: 'S2', label: 'Secondary 2' },
  { value: 'S3', label: 'Secondary 3' },
  { value: 'S4', label: 'Secondary 4' },
  { value: 'S5', label: 'Secondary 5' },
];

export default function StudentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('');
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.role === 'student') {
      navigate('/worksheets');
      return;
    }
    loadStudents();
  }, [user]);

  const loadStudents = async () => {
    try {
      const res = await studentsAPI.list();
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setCreated(null);
    setSaving(true);
    try {
      const res = await studentsAPI.create({ name, email, password, ...(level ? { level } : {}) });
      setCreated({ ...res.data.student, password });
      setName('');
      setEmail('');
      setPassword('');
      setLevel('');
      loadStudents();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || data?.errors?.[0]?.msg || 'Could not create the student login.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this student login? Their assigned plans stay with you.')) return;
    try {
      await studentsAPI.remove(id);
      loadStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove the student.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald" />
                Students
              </h1>
              <p className="text-gray-600 text-sm">Create logins so students can do practice and see their mistakes.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a student login</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
              >
                <option value="">Select level</option>
                {STUDENT_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Login email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 6 characters"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You set the login + password and share them with the student. They can be any email you control.
          </p>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {created && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">
                Created <span className="font-medium">{created.name}</span>. They log in with{' '}
                <span className="font-medium">{created.email}</span> / <span className="font-medium">{created.password}</span>.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-emerald text-white rounded-lg hover:bg-emerald-deep disabled:opacity-50 transition font-medium"
          >
            <UserPlus className="w-4 h-4" />
            {saving ? 'Creating…' : 'Create student login'}
          </button>
        </form>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your students</h2>
          </div>
          {students.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No student logins yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {students.map((s) => (
                <li key={s._id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    aria-label="Remove student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
