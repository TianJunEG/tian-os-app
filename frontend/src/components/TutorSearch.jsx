import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TutorSearch.css';

const TutorSearch = () => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [filters, setFilters] = useState({
    subject: '',
    maxRate: 100,
    minRating: 0,
    sortBy: 'match'
  });

  const API_URL = 'http://localhost:5001/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTutors();
  }, [filters]);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/search/match`,
        {
          grade: localStorage.getItem('gradeLevel'),
          subject: filters.subject || localStorage.getItem('primarySubject'),
          budget: filters.maxRate
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      let results = response.data.tutors || [];

      // Sort based on filter
      if (filters.sortBy === 'rating') {
        results = results.sort((a, b) => b.rating.average - a.rating.average);
      } else if (filters.sortBy === 'price') {
        results = results.sort((a, b) => a.hourlyRate - b.hourlyRate);
      } else if (filters.sortBy === 'experience') {
        results = results.sort((a, b) => b.totalHoursTaught - a.totalHoursTaught);
      }

      setTutors(results);
    } catch (error) {
      console.error('Failed to fetch tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = (tutor) => {
    // Store selected tutor and navigate to booking flow
    localStorage.setItem('selectedTutorId', tutor._id);
    localStorage.setItem('selectedTutorName', tutor.name);
    window.location.href = '/booking';
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>🔍 Find Your Perfect Tutor</h1>
        <p>We found {tutors.length} qualified tutors matching your needs</p>
      </div>

      <div className="search-layout">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="filters-card">
            <h3>Filters</h3>

            <div className="filter-group">
              <label htmlFor="subject">Subject</label>
              <select
                id="subject"
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              >
                <option value="">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Science">Science</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="History">History</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="SAT Prep">SAT Prep</option>
                <option value="ACT Prep">ACT Prep</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="maxRate">Max Rate: ${filters.maxRate}/hr</label>
              <input
                id="maxRate"
                type="range"
                min="10"
                max="200"
                step="5"
                value={filters.maxRate}
                onChange={(e) => setFilters(prev => ({ ...prev, maxRate: parseInt(e.target.value) }))}
              />
              <div className="range-labels">
                <span>$10</span>
                <span>$200</span>
              </div>
            </div>

            <div className="filter-group">
              <label htmlFor="minRating">Min Rating: ⭐ {filters.minRating}</label>
              <input
                id="minRating"
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.minRating}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="sortBy">Sort By</label>
              <select
                id="sortBy"
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              >
                <option value="match">Best Match</option>
                <option value="rating">Highest Rating</option>
                <option value="price">Lowest Price</option>
                <option value="experience">Most Experience</option>
              </select>
            </div>

            <button className="btn-reset" onClick={() => setFilters({
              subject: '',
              maxRate: 100,
              minRating: 0,
              sortBy: 'match'
            })}>
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Results */}
        <main className="search-results">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Finding the perfect tutors for you...</p>
            </div>
          ) : tutors.length === 0 ? (
            <div className="empty-state">
              <p>No tutors found matching your criteria.</p>
              <p>Try adjusting your filters and searching again.</p>
            </div>
          ) : (
            <div className="tutors-grid">
              {tutors.map(tutor => (
                <div key={tutor._id} className="tutor-card">
                  <div className="tutor-header">
                    <div className="tutor-info">
                      <h3>{tutor.name}</h3>
                      <div className="rating">
                        <span className="stars">{'⭐'.repeat(Math.floor(tutor.rating.average))}</span>
                        <span className="rating-value">{tutor.rating.average}/5.0</span>
                        <span className="review-count">({tutor.rating.count} reviews)</span>
                      </div>
                    </div>
                    <div className="tutor-rate">
                      <span className="rate">${tutor.hourlyRate}</span>
                      <span className="per-hour">/hr</span>
                    </div>
                  </div>

                  <div className="tutor-body">
                    <p className="bio">{tutor.bio}</p>

                    <div className="stats">
                      <div className="stat">
                        <span className="stat-label">Experience</span>
                        <span className="stat-value">{tutor.experience}+ yrs</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Sessions</span>
                        <span className="stat-value">{tutor.totalHoursTaught}+ hrs</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Success Rate</span>
                        <span className="stat-value">{tutor.matchSuccessRate}%</span>
                      </div>
                    </div>

                    <div className="specialties">
                      <p className="label">Specialties:</p>
                      <div className="tags">
                        {tutor.specialties.slice(0, 3).map(specialty => (
                          <span key={specialty} className="tag">{specialty}</span>
                        ))}
                        {tutor.specialties.length > 3 && (
                          <span className="tag more">+{tutor.specialties.length - 3}</span>
                        )}
                      </div>
                    </div>

                    <div className="match-info">
                      <p className="match-score">Match Score: {tutor.compatibilityScore}/100</p>
                      {tutor.matchExplanation && (
                        <details>
                          <summary>Why this match?</summary>
                          <p>{tutor.matchExplanation}</p>
                        </details>
                      )}
                    </div>
                  </div>

                  <div className="tutor-footer">
                    <button className="btn-book" onClick={() => handleBooking(tutor)}>
                      📅 Book Session
                    </button>
                    <button className="btn-message">
                      💬 Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TutorSearch;
