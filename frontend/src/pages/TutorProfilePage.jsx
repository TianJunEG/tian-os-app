import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tutorsAPI } from '../services/api';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function TutorProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    headline: '', description: '', specialties: [], grades: [],
    hourlyRate: '', languages: [], experience: '', qualifications: ''
  });

  const specialtyOptions = ['Math', 'English', 'Science', 'History', 'Languages', 'Test Prep', 'Programming', 'Business', 'Arts', 'Music'];
  const gradeOptions = ['Elementary', 'Middle School', 'High School', 'College', 'All Levels'];

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const r = await tutorsAPI.getMyProfile();
      const p = r.data.tutorProfile;
      setFormData({
        headline: p.headline || '', description: p.description || '',
        specialties: p.specialties || [], grades: p.grades || [],
        hourlyRate: p.hourlyRate || '', languages: p.languages || [],
        experience: p.experience || '', qualifications: p.qualifications || ''
      });
    } catch {}
    finally { setLoading(false); }
  };

  const toggleArray = (field, val) => setFormData(p => ({
    ...p, [field]: p[field].includes(val) ? p[field].filter(v => v !== val) : [...p[field], val]
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await tutorsAPI.createProfile(formData);
      setSuccess('Profile saved!');
      await loadProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gold-600">Tutor</div>
            <h1 className="text-3xl font-serif font-medium text-emerald-deep leading-tight">My Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-emerald-tint shadow-sm p-6">
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-green-700">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Professional Headline</label>
              <input type="text" name="headline" value={formData.headline}
                onChange={e => setFormData(p => ({ ...p, headline: e.target.value }))}
                placeholder="e.g. Expert Math Tutor with 10 Years Experience"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
              <input type="number" name="hourlyRate" value={formData.hourlyRate}
                onChange={e => setFormData(p => ({ ...p, hourlyRate: e.target.value }))}
                placeholder="50" min="5" max="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Specialties</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {specialtyOptions.map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.specialties.includes(s)}
                      onChange={() => toggleArray('specialties', s)}
                      className="w-4 h-4 accent-navy-700 rounded" />
                    <span className="text-sm text-gray-700">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Grade Levels</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gradeOptions.map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.grades.includes(g)}
                      onChange={() => toggleArray('grades', g)}
                      className="w-4 h-4 accent-navy-700 rounded" />
                    <span className="text-sm text-gray-700">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">About You</label>
              <textarea name="description" value={formData.description} rows={4}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Tell students about your teaching style and experience…"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Experience</label>
              <textarea name="experience" value={formData.experience} rows={3}
                onChange={e => setFormData(p => ({ ...p, experience: e.target.value }))}
                placeholder="Describe your teaching experience…"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications &amp; Certifications</label>
              <textarea name="qualifications" value={formData.qualifications} rows={3}
                onChange={e => setFormData(p => ({ ...p, qualifications: e.target.value }))}
                placeholder="List your degrees, certifications, and qualifications…"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
              <input type="text"
                value={formData.languages.join(', ')}
                onChange={e => setFormData(p => ({ ...p, languages: e.target.value.split(',').map(l => l.trim()).filter(Boolean) }))}
                placeholder="e.g. English, Spanish, French (comma-separated)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent" />
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-emerald-deep hover:bg-emerald-deep text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
