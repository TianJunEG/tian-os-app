import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tutorsAPI } from '../services/api';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function TutorProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    headline: '',
    description: '',
    specialties: [],
    grades: [],
    hourlyRate: '',
    languages: [],
    experience: '',
    qualifications: ''
  });

  const specialtyOptions = [
    'Math', 'English', 'Science', 'History', 'Languages',
    'Test Prep', 'Programming', 'Business', 'Arts', 'Music'
  ];

  const gradeOptions = [
    'Elementary', 'Middle School', 'High School', 'College', 'All Levels'
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await tutorsAPI.getMyProfile();
      const profileData = response.data.tutorProfile;
      setProfile(profileData);
      setFormData({
        headline: profileData.headline || '',
        description: profileData.description || '',
        specialties: profileData.specialties || [],
        grades: profileData.grades || [],
        hourlyRate: profileData.hourlyRate || '',
        languages: profileData.languages || [],
        experience: profileData.experience || '',
        qualifications: profileData.qualifications || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Profile doesn't exist yet, that's ok
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleArray = (fieldName, value) => {
    setFormData(prev => {
      const arr = prev[fieldName];
      if (arr.includes(value)) {
        return { ...prev, [fieldName]: arr.filter(v => v !== value) };
      } else {
        return { ...prev, [fieldName]: [...arr, value] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await tutorsAPI.createProfile(formData);
      setSuccess('Profile saved successfully!');
      await loadProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Tutor Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Headline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Headline
              </label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                placeholder="e.g. Expert Math Tutor with 10 Years Experience"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                placeholder="50"
                min="5"
                max="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Specialties
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {specialtyOptions.map(specialty => (
                  <label key={specialty} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={() => toggleArray('specialties', specialty)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="ml-2 text-gray-700 text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Grades */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Grade Levels
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gradeOptions.map(grade => (
                  <label key={grade} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.grades.includes(grade)}
                      onChange={() => toggleArray('grades', grade)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="ml-2 text-gray-700 text-sm">{grade}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About You
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell students about your teaching style and experience..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teaching Experience
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Describe your teaching experience..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Qualifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualifications & Certifications
              </label>
              <textarea
                name="qualifications"
                value={formData.qualifications}
                onChange={handleChange}
                placeholder="List your degrees, certifications, and qualifications..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages
              </label>
              <input
                type="text"
                placeholder="e.g. English, Spanish, French (comma-separated)"
                value={formData.languages.join(', ')}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  languages: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
