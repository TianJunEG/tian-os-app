import React, { useState, useEffect } from 'react';
import { Star, MapPin, Clock, DollarSign, Heart, MessageSquare, Filter, Search, ChevronDown, CheckCircle, TrendingUp } from 'lucide-react';

export default function TutorSearchMarketplace() {
  const [tutors, setTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [savedTutors, setSavedTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    minRating: 4.0,
    maxRate: 100,
    availability: 'any',
    experienceLevel: 'all',
    teachingStyle: 'all',
    sortBy: 'relevance'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);

  // Mock data - replace with API call
  useEffect(() => {
    const mockTutors = [
      {
        id: 1,
        name: 'Sarah Chen',
        subjects: ['AP Calculus', 'Algebra', 'Geometry'],
        hourlyRate: 45,
        rating: 4.9,
        reviews: 287,
        experience: 8,
        location: 'San Francisco, CA',
        bio: 'MIT grad passionate about making math intuitive. 8 years of tutoring experience.',
        teachingStyle: ['Visual', 'Interactive', 'Project-based'],
        availability: ['Weekdays 3-9pm', 'Weekends flexible'],
        studentCount: 45,
        successRate: 95,
        badge: 'Top Tutor',
        image: '👩‍🏫',
        responseTime: '2 hours',
        totalHours: 2400
      },
      {
        id: 2,
        name: 'Marcus Johnson',
        subjects: ['Physics', 'Chemistry', 'Biology'],
        hourlyRate: 40,
        rating: 4.8,
        reviews: 195,
        experience: 6,
        location: 'Boston, MA',
        bio: 'Physics teacher with a knack for making complex concepts click.',
        teachingStyle: ['Hands-on', 'Conceptual', 'Socratic'],
        availability: ['Evenings', 'Weekends'],
        studentCount: 32,
        successRate: 92,
        badge: 'Educator',
        image: '👨‍🔬',
        responseTime: '1 hour',
        totalHours: 1800
      },
      {
        id: 3,
        name: 'Emma Rodriguez',
        subjects: ['Spanish', 'French', 'Portuguese'],
        hourlyRate: 35,
        rating: 4.95,
        reviews: 312,
        experience: 7,
        location: 'Miami, FL',
        bio: 'Native Spanish speaker. Focus on conversational fluency.',
        teachingStyle: ['Conversational', 'Cultural', 'Game-based'],
        availability: ['Flexible', 'Timezone friendly'],
        studentCount: 58,
        successRate: 98,
        badge: 'Native Speaker',
        image: '👩‍🎓',
        responseTime: '30 min',
        totalHours: 2100
      },
      {
        id: 4,
        name: 'David Kim',
        subjects: ['Computer Science', 'Python', 'Web Dev'],
        hourlyRate: 50,
        rating: 4.7,
        reviews: 124,
        experience: 5,
        location: 'Seattle, WA',
        bio: 'Software engineer teaching code to the next generation.',
        teachingStyle: ['Project-based', 'Practical', 'Mentoring'],
        availability: ['Evenings', 'Weekends'],
        studentCount: 28,
        successRate: 90,
        badge: 'Industry Pro',
        image: '👨‍💻',
        responseTime: '4 hours',
        totalHours: 1500
      },
      {
        id: 5,
        name: 'Lisa Thompson',
        subjects: ['English', 'Literature', 'Writing'],
        hourlyRate: 38,
        rating: 4.85,
        reviews: 218,
        experience: 9,
        location: 'New York, NY',
        bio: 'Published author. Expert in essay writing and literature analysis.',
        teachingStyle: ['Analytical', 'Creative', 'Socratic'],
        availability: ['Flexible', 'Mornings'],
        studentCount: 41,
        successRate: 94,
        badge: 'Expert',
        image: '👩‍🎓',
        responseTime: '3 hours',
        totalHours: 2700
      }
    ];

    setTutors(mockTutors);
    setFilteredTutors(mockTutors);
    setLoading(false);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = tutors;

    // Subject filter
    if (filters.subject) {
      filtered = filtered.filter(t =>
        t.subjects.some(s => s.toLowerCase().includes(filters.subject.toLowerCase()))
      );
    }

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.subjects.some(s => s.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Rating filter
    filtered = filtered.filter(t => t.rating >= filters.minRating);

    // Rate filter
    filtered = filtered.filter(t => t.hourlyRate <= filters.maxRate);

    // Experience filter
    if (filters.experienceLevel !== 'all') {
      if (filters.experienceLevel === 'beginner') {
        filtered = filtered.filter(t => t.experience < 3);
      } else if (filters.experienceLevel === 'intermediate') {
        filtered = filtered.filter(t => t.experience >= 3 && t.experience < 7);
      } else if (filters.experienceLevel === 'expert') {
        filtered = filtered.filter(t => t.experience >= 7);
      }
    }

    // Sort
    if (filters.sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => a.hourlyRate - b.hourlyRate);
    } else if (filters.sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => b.hourlyRate - a.hourlyRate);
    } else if (filters.sortBy === 'reviews') {
      filtered = [...filtered].sort((a, b) => b.reviews - a.reviews);
    }

    setFilteredTutors(filtered);
  }, [filters, tutors]);

  const toggleSaveTutor = (tutorId) => {
    setSavedTutors(prev =>
      prev.includes(tutorId)
        ? prev.filter(id => id !== tutorId)
        : [...prev, tutorId]
    );
  };

  const handleBooking = (tutorId) => {
    // Redirect to booking page
    window.location.href = `/book/${tutorId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Find Your Perfect Tutor</h1>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tutors or subjects..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700"
            >
              <Filter size={18} />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Filters</h2>

              {/* Subject */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="">All Subjects</option>
                  <option value="math">Math</option>
                  <option value="science">Science</option>
                  <option value="english">English</option>
                  <option value="languages">Languages</option>
                  <option value="computer">Computer Science</option>
                </select>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Minimum Rating: {filters.minRating}⭐
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Hourly Rate */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Max Rate: ${filters.maxRate}/hr
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={filters.maxRate}
                  onChange={(e) => setFilters({ ...filters, maxRate: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Experience</label>
                <select
                  value={filters.experienceLevel}
                  onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">New (0-3 years)</option>
                  <option value="intermediate">Experienced (3-7 years)</option>
                  <option value="expert">Expert (7+ years)</option>
                </select>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Availability</label>
                <select
                  value={filters.availability}
                  onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="any">Any Time</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                  <option value="evenings">Evenings</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="rating">Highest Rating</option>
                  <option value="price-low">Lowest Price</option>
                  <option value="price-high">Highest Price</option>
                  <option value="reviews">Most Reviewed</option>
                </select>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => setFilters({
                  search: '',
                  subject: '',
                  minRating: 4.0,
                  maxRate: 100,
                  availability: 'any',
                  experienceLevel: 'all',
                  teachingStyle: 'all',
                  sortBy: 'relevance'
                })}
                className="w-full mt-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Tutors Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading tutors...</p>
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-600 text-lg">No tutors found matching your criteria.</p>
                <p className="text-slate-500 mt-2">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Showing <strong>{filteredTutors.length}</strong> tutors
                </p>

                {filteredTutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    className="bg-white rounded-xl border border-slate-200 hover:shadow-lg transition overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex gap-6">
                        {/* Avatar */}
                        <div className="text-6xl flex-shrink-0">{tutor.image}</div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">{tutor.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin size={14} />
                                {tutor.location}
                              </div>
                            </div>
                            {tutor.badge && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                {tutor.badge}
                              </span>
                            )}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < Math.floor(tutor.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
                                />
                              ))}
                              <span className="ml-1 font-bold text-slate-900">{tutor.rating}</span>
                              <span className="text-xs text-slate-500">({tutor.reviews} reviews)</span>
                            </div>
                          </div>

                          {/* Bio */}
                          <p className="text-slate-600 mb-4">{tutor.bio}</p>

                          {/* Subjects */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {tutor.subjects.map((subject, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-slate-500 text-xs">Experience</p>
                              <p className="font-bold text-slate-900">{tutor.experience} yrs</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-slate-500 text-xs">Success Rate</p>
                              <p className="font-bold text-slate-900">{tutor.successRate}%</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-slate-500 text-xs">Response Time</p>
                              <p className="font-bold text-slate-900">{tutor.responseTime}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-slate-500 text-xs">Total Hours</p>
                              <p className="font-bold text-slate-900">{tutor.totalHours}</p>
                            </div>
                          </div>

                          {/* Teaching Style */}
                          <div className="mb-4">
                            <p className="text-xs text-slate-500 mb-2">Teaching Style:</p>
                            <div className="flex gap-2">
                              {tutor.teachingStyle.map((style, idx) => (
                                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {style}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Price & Actions */}
                        <div className="flex flex-col items-end justify-between min-w-fit">
                          <div className="text-right mb-4">
                            <p className="text-sm text-slate-600">Hourly rate</p>
                            <p className="text-3xl font-bold text-blue-600">${tutor.hourlyRate}</p>
                            <p className="text-xs text-slate-500">/hour</p>
                          </div>

                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => handleBooking(tutor.id)}
                              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                            >
                              Book Now
                            </button>
                            <button
                              onClick={() => toggleSaveTutor(tutor.id)}
                              className={`px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap flex items-center justify-center gap-2 ${
                                savedTutors.includes(tutor.id)
                                  ? 'bg-red-50 text-red-600 border border-red-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              <Heart size={18} className={savedTutors.includes(tutor.id) ? 'fill-red-600' : ''} />
                              {savedTutors.includes(tutor.id) ? 'Saved' : 'Save'}
                            </button>
                            <button className="px-6 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition whitespace-nowrap flex items-center justify-center gap-2">
                              <MessageSquare size={18} />
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
