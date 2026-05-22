import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { Star, MapPin, Clock, Search } from 'lucide-react';

export default function TutorSearchPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    specialty: '',
    grade: '',
    maxRate: '',
    limit: 20
  });
  const [tutors, setTutors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const response = await searchAPI.searchTutors({
        specialty: filters.specialty || undefined,
        grade: filters.grade || undefined,
        maxRate: filters.maxRate ? parseInt(filters.maxRate) : undefined,
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Find Your Tutor</h1>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level
                </label>
                <select
                  value={filters.grade}
                  onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
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
                    onClick={() => {
                      handleCategoryClick(cat.name);
                      setFilters(prev => ({ ...prev, specialty: cat.name }));
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 rounded-lg hover:shadow-md transition text-sm font-medium"
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Searching for tutors...</p>
          </div>
        ) : searched ? (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {tutors.length} Tutor{tutors.length !== 1 ? 's' : ''} Found
              </h2>
            </div>

            {tutors.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 mb-4">No tutors found matching your criteria.</p>
                <button
                  onClick={() => setSearched(false)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Try different filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutors.map((tutor) => (
                  <div key={tutor._id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {tutor.userId?.name}
                          </h3>
                          {tutor.headline && (
                            <p className="text-sm text-gray-600">{tutor.headline}</p>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(tutor.rating.average)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {tutor.rating.average} ({tutor.rating.count} reviews)
                        </span>
                      </div>

                      {/* Specialties */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {tutor.specialties.slice(0, 3).map((specialty) => (
                            <span
                              key={specialty}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
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

                      {/* Compatibility Score */}
                      {tutor.compatibilityScore && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Compatibility</span>
                            <span className="text-sm font-bold text-blue-600">
                              {tutor.compatibilityScore.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                              style={{ width: `${tutor.compatibilityScore.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Rate and Button */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            ${tutor.hourlyRate}
                          </p>
                          <p className="text-xs text-gray-600">per hour</p>
                        </div>
                        <button
                          onClick={() => navigate(`/booking/${tutor.userId._id}`)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
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
