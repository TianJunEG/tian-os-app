import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { Star, MapPin, Clock, Search, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CRITERIA = [
  { key: 'subjectAlignment', label: 'Subject' },
  { key: 'gradeFit', label: 'Grade level' },
  { key: 'teachingStyle', label: 'Teaching style' },
  { key: 'availability', label: 'Availability' },
  { key: 'locationProximity', label: 'Location' },
  { key: 'tutorSuccessRate', label: 'Success rate' },
  { key: 'parentPreferences', label: 'Preferences' },
  { key: 'specialNeedsCompat', label: 'Special needs' },
  { key: 'priceFit', label: 'Price' }
];

const scoreColor = (score) => {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  return 'text-gray-500';
};

const barColor = (score) => {
  if (score >= 85) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-gray-300';
};

function MatchScore({ score, confidence }) {
  const pct = Math.round(score || 0);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeLinecap="round"
            className={pct >= 85 ? 'stroke-green-500' : pct >= 70 ? 'stroke-blue-500' : 'stroke-gray-400'}
            strokeDasharray={`${pct}, 100`}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${scoreColor(pct)}`}>
          {pct}
        </div>
      </div>
      <span
        className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          confidence === 'High' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}
      >
        {confidence || 'Medium'} match
      </span>
    </div>
  );
}

function CriteriaBreakdown({ scores }) {
  if (!scores) return null;
  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      {CRITERIA.map(({ key, label }) => {
        const value = Math.round(scores[key] ?? 0);
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-24 shrink-0">{label}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div className={`${barColor(value)} h-1.5 rounded-full`} style={{ width: `${value}%` }}></div>
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function TutorSearchPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    specialty: '',
    grade: '',
    maxRate: '',
    teachingStyle: '',
    postalCode: '',
    preferredDays: [],
    limit: 20
  });
  const [tutors, setTutors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await searchAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const toggleDay = (day) => {
    setFilters(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day]
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setExpanded({});

    try {
      const response = await searchAPI.searchTutors({
        specialty: filters.specialty || undefined,
        grade: filters.grade || undefined,
        maxRate: filters.maxRate ? parseInt(filters.maxRate) : undefined,
        teachingStyle: filters.teachingStyle || undefined,
        postalCode: filters.postalCode || undefined,
        preferredDays: filters.preferredDays.length ? filters.preferredDays : undefined,
        limit: filters.limit
      });
      setTutors(response.data.tutors || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setFilters(prev => ({ ...prev, specialty: category }));
  };

  const grades = ['Elementary', 'Middle School', 'High School', 'College', 'All Levels'];

  // Matching is on only when the server returns scores; otherwise it's a directory.
  const matchingOn = tutors.some((t) => t.matchScore != null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gold-600">Marketplace</div>
          <h1 className="text-3xl font-serif font-medium text-emerald-deep leading-tight">Find Your Tutor</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Math, English"
                  value={filters.specialty}
                  onChange={(e) => setFilters(prev => ({ ...prev, specialty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level
                </label>
                <select
                  value={filters.grade}
                  onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                >
                  <option value="">All levels</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Rate ($/hr)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 75"
                  value={filters.maxRate}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teaching Style
                </label>
                <select
                  value={filters.teachingStyle}
                  onChange={(e) => setFilters(prev => ({ ...prev, teachingStyle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                >
                  <option value="">No preference</option>
                  <option value="conceptual">Conceptual (understanding-first)</option>
                  <option value="balanced">Balanced</option>
                  <option value="rote">Rote (practice-heavy)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 570123"
                  value={filters.postalCode}
                  onChange={(e) => setFilters(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        filters.preferredDays.includes(day)
                          ? 'bg-emerald text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-navy-600 to-blue-600 text-white font-medium py-2 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Categories */}
          {!searched && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-gray-700 mb-4">Popular Subjects</p>
              <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryClick(cat.name)}
                    className="px-4 py-2 bg-gradient-to-r from-navy-100 to-blue-100 text-gray-800 rounded-lg hover:shadow-md transition text-sm font-medium"
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results. Auto-matching is gated server-side; when it's off the tutors
            come back without a matchScore, so we render a plain directory. */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
            <p className="mt-4 text-gray-600">{matchingOn ? 'Finding your best matches...' : 'Finding tutors...'}</p>
          </div>
        ) : searched ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald" />
              <h2 className="text-xl font-semibold text-gray-900">
                {matchingOn
                  ? `${tutors.length} Match${tutors.length !== 1 ? 'es' : ''} Found`
                  : `${tutors.length} Tutor${tutors.length !== 1 ? 's' : ''}`}
              </h2>
              {tutors.length > 0 && (
                <span className="text-sm text-gray-500">{matchingOn ? 'ranked by compatibility' : 'sorted by rating'}</span>
              )}
            </div>

            {tutors.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 mb-4">No tutors match these filters yet.</p>
                <button
                  onClick={() => setSearched(false)}
                  className="text-emerald hover:text-emerald-deep font-medium"
                >
                  Try different filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutors.map((tutor) => {
                  const isOpen = expanded[tutor._id];
                  return (
                    <div key={tutor._id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4 gap-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {tutor.userId?.name}
                            </h3>
                            {tutor.headline && (
                              <p className="text-sm text-gray-600">{tutor.headline}</p>
                            )}
                          </div>
                          {tutor.matchScore != null && <MatchScore score={tutor.matchScore} confidence={tutor.matchConfidence} />}
                        </div>

                        {/* Match explanation */}
                        {tutor.explanation && (
                          <div className="mb-3 p-3 bg-emerald-tint rounded-lg">
                            <p className="text-sm text-emerald-deep">{tutor.explanation}</p>
                          </div>
                        )}

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.round(tutor.rating?.average || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {tutor.rating?.average || 0} ({tutor.rating?.count || 0} reviews)
                          </span>
                        </div>

                        {/* Specialties */}
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-2">
                            {(tutor.specialties || []).slice(0, 3).map((specialty) => (
                              <span
                                key={specialty}
                                className="px-2 py-1 bg-emerald-tint text-emerald-deep rounded text-xs font-medium"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-2 mb-4 text-sm text-gray-600">
                          {tutor.userId?.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {tutor.userId.location}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {tutor.totalHoursTaught} hours taught
                          </div>
                        </div>

                        {/* Why this match toggle — only when matching is on */}
                        {tutor.matchScore != null && (
                          <>
                            <button
                              type="button"
                              onClick={() => setExpanded(prev => ({ ...prev, [tutor._id]: !prev[tutor._id] }))}
                              className="flex items-center gap-1 text-sm font-medium text-emerald hover:text-emerald-deep"
                            >
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              Why this match?
                            </button>
                            {isOpen && <CriteriaBreakdown scores={tutor.criteriaScores} />}
                          </>
                        )}

                        {/* Rate and Button */}
                        <div className="flex items-center justify-between mt-4">
                          <div>
                            <p className="text-2xl font-bold text-emerald">
                              ${tutor.hourlyRate}
                            </p>
                            <p className="text-xs text-gray-600">per hour</p>
                          </div>
                          <button
                            onClick={() => navigate(`/booking/${tutor.userId._id}`)}
                            className="px-4 py-2 bg-emerald text-white rounded-lg hover:bg-emerald-deep transition font-medium text-sm"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
