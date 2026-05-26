import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { Star, MapPin, Clock, Search, ArrowLeft } from 'lucide-react';

export default function TutorSearchPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ specialty: '', grade: '', maxRate: '', limit: 20 });
  const [tutors, setTutors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    searchAPI.getCategories()
      .then(r => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const r = await searchAPI.searchTutors({
        specialty: filters.specialty || undefined,
        grade: filters.grade || undefined,
        maxRate: filters.maxRate ? parseInt(filters.maxRate) : undefined,
        limit: filters.limit,
      });
      setTutors(r.data.tutors || []);
    } catch {}
    finally { setLoading(false); }
  };

  const grades = ['Elementary', 'Middle School', 'High School', 'College', 'All Levels'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gold-600">Marketplace</div>
            <h1 className="text-3xl font-serif font-medium text-navy-900 leading-tight">Find a Tutor</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-2xl border border-navy-100 shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Math, English"
                  value={filters.specialty}
                  onChange={e => setFilters(p => ({ ...p, specialty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                <select
                  value={filters.grade}
                  onChange={e => setFilters(p => ({ ...p, grade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                >
                  <option value="">All levels</option>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Rate ($/hr)</label>
                <input
                  type="number"
                  placeholder="e.g. 75"
                  value={filters.maxRate}
                  onChange={e => setFilters(p => ({ ...p, maxRate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-navy-800 hover:bg-navy-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
          </form>

          {!searched && categories.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-gold-600 mb-3">Popular Subjects</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setFilters(p => ({ ...p, specialty: cat.name }))}
                    className="px-4 py-2 bg-navy-100 text-navy-700 rounded-lg hover:bg-navy-200 transition text-sm font-medium"
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-navy-700" />
            <p className="mt-4 text-gray-600">Searching for tutors…</p>
          </div>
        ) : searched ? (
          <>
            <p className="text-sm font-bold tracking-[0.15em] uppercase text-gold-600 mb-1">Results</p>
            <h2 className="text-2xl font-serif font-medium text-navy-900 mb-6">
              {tutors.length} Tutor{tutors.length !== 1 ? 's' : ''} Found
            </h2>

            {tutors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-navy-100 shadow-sm p-12 text-center">
                <p className="text-gray-600 mb-4">No tutors found matching your criteria.</p>
                <button onClick={() => setSearched(false)} className="text-navy-700 hover:text-navy-900 font-semibold">
                  Try different filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutors.map(tutor => (
                  <div key={tutor._id} className="bg-white rounded-2xl border border-navy-100 shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col">
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Avatar + Name */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-11 h-11 rounded-full bg-navy-700 text-white grid place-items-center font-bold text-base shrink-0">
                          {tutor.userId?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-navy-900 truncate">{tutor.userId?.name}</h3>
                          {tutor.headline && <p className="text-sm text-gray-500 line-clamp-1">{tutor.headline}</p>}
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.round(tutor.rating.average) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{tutor.rating.average} ({tutor.rating.count})</span>
                      </div>

                      {/* Specialties */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {tutor.specialties.slice(0, 3).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-navy-100 text-navy-700 rounded text-xs font-medium">{s}</span>
                        ))}
                      </div>

                      {/* Meta */}
                      <div className="space-y-1 text-sm text-gray-500 mb-4">
                        {tutor.userId?.location && (
                          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{tutor.userId.location}</div>
                        )}
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{tutor.totalHoursTaught} hrs taught</div>
                      </div>

                      {/* Compatibility */}
                      {tutor.compatibilityScore && (
                        <div className="mb-4 p-3 bg-navy-50 rounded-xl">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-semibold text-navy-700">Compatibility</span>
                            <span className="text-xs font-bold text-navy-800">{tutor.compatibilityScore.percentage}%</span>
                          </div>
                          <div className="w-full bg-navy-100 rounded-full h-1.5">
                            <div className="bg-gold-400 h-1.5 rounded-full" style={{ width: `${tutor.compatibilityScore.percentage}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Rate + CTA */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-2xl font-bold text-navy-800">${tutor.hourlyRate}</p>
                          <p className="text-xs text-gray-500">per hour</p>
                        </div>
                        <button
                          onClick={() => navigate(`/booking/${tutor.userId._id}`)}
                          className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-xl font-semibold text-sm transition"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
