import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, tutorsAPI } from '../services/api';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export default function BookingPage() {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tutor, setTutor] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    duration: 1,
    scheduledDate: '',
    startTime: '09:00',
    sessionType: 'online',
    notes: '',
    meetingLink: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  React.useEffect(() => {
    loadTutorProfile();
  }, [tutorId]);

  const loadTutorProfile = async () => {
    try {
      const response = await tutorsAPI.getTutorProfile(tutorId);
      setTutor(response.data.tutorProfile);
    } catch (error) {
      console.error('Failed to load tutor:', error);
      setError('Tutor not found');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (duration * 60);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endTime = calculateEndTime(formData.startTime, formData.duration);
      const booking = await bookingsAPI.createBooking({
        tutorId,
        subject: formData.subject,
        duration: parseFloat(formData.duration),
        scheduledDate: formData.scheduledDate,
        startTime: formData.startTime,
        endTime,
        sessionType: formData.sessionType,
        notes: formData.notes,
        meetingLink: formData.sessionType === 'online' ? formData.meetingLink : '',
        location: formData.sessionType === 'in-person' ? formData.location : ''
      });

      // Redirect to payment page
      navigate(`/payment/${booking.data.booking._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!tutor) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const totalCost = tutor.hourlyRate * parseFloat(formData.duration || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Book a Session</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tutor Info Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{tutor.userId?.name}</h3>
                <p className="text-sm text-gray-600">{tutor.headline}</p>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b">
                <div>
                  <p className="text-sm text-gray-600">Hourly Rate</p>
                  <p className="text-2xl font-bold text-navy-600">${tutor.hourlyRate}/hr</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ⭐ {tutor.rating.average} ({tutor.rating.count} reviews)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{formData.duration} hour(s)</p>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Session Cost</span>
                    <span className="text-xl font-bold text-navy-600">${totalCost}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Platform fee (10%)</span>
                    <span>${(totalCost * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t mt-4 pt-4 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-navy-600">${totalCost}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What subject do you need help with?
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Algebra homework, SAT prep"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (hours)
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  >
                    <option value={0.5}>0.5 hours ($25)</option>
                    <option value={1}>1 hour (${tutor.hourlyRate})</option>
                    <option value={1.5}>1.5 hours (${tutor.hourlyRate * 1.5})</option>
                    <option value={2}>2 hours (${tutor.hourlyRate * 2})</option>
                    <option value={3}>3 hours (${tutor.hourlyRate * 3})</option>
                    <option value={4}>4 hours (${tutor.hourlyRate * 4})</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    When do you want to schedule?
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Start time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Session Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Session Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sessionType"
                        value="online"
                        checked={formData.sessionType === 'online'}
                        onChange={handleChange}
                        className="w-4 h-4 text-navy-600"
                      />
                      <span className="ml-3 text-gray-700">Online (via Zoom/Google Meet)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sessionType"
                        value="in-person"
                        checked={formData.sessionType === 'in-person'}
                        onChange={handleChange}
                        className="w-4 h-4 text-navy-600"
                      />
                      <span className="ml-3 text-gray-700">In-person</span>
                    </label>
                  </div>
                </div>

                {/* Session Details */}
                {formData.sessionType === 'online' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Link (optional)
                    </label>
                    <input
                      type="url"
                      name="meetingLink"
                      value={formData.meetingLink}
                      onChange={handleChange}
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="123 Main St, City, State"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes for the tutor (optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Let the tutor know what you want to focus on..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-navy-600 to-blue-600 text-white font-medium py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
