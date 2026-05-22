import React, { useState } from 'react';
import axios from 'axios';
import './BookingFlow.css';

const BookingFlow = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const API_URL = 'http://localhost:5001/api';
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const selectedTutorId = localStorage.getItem('selectedTutorId');
  const selectedTutorName = localStorage.getItem('selectedTutorName');

  const [tutorInfo, setTutorInfo] = useState({
    hourlyRate: 55,
    name: selectedTutorName || 'Tutor'
  });

  const [bookingData, setBookingData] = useState({
    // Step 1: Date & Time
    date: '',
    startTime: '',
    duration: '1',

    // Step 2: Session Details
    subject: localStorage.getItem('primarySubject') || '',
    sessionNotes: '',
    sessionType: localStorage.getItem('preferredSessionType') || 'online',
    meetingLink: '',
    location: '',

    // Step 3: Confirmation
    agreeToTerms: false,
    paymentMethod: 'card'
  });

  const [errors, setErrors] = useState({});

  // Calculate total cost
  const duration = parseFloat(bookingData.duration);
  const totalCost = tutorInfo.hourlyRate * duration;
  const platformFee = totalCost * 0.12;
  const tutorEarns = totalCost * 0.88;

  // Get minimum date (today or tomorrow)
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  // Get available time slots (avoid conflicts)
  const getTimeSlots = () => {
    const slots = [];
    for (let i = 8; i < 22; i++) {
      slots.push(`${String(i).padStart(2, '0')}:00`);
      slots.push(`${String(i).padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Get end time based on duration
  const getEndTime = () => {
    if (!bookingData.startTime) return '';
    const [hours, mins] = bookingData.startTime.split(':').map(Number);
    const endHours = hours + Math.floor(duration);
    const endMins = mins + (duration % 1) * 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  };

  // Validation
  const validateStep1 = () => {
    const newErrors = {};
    if (!bookingData.date) {
      newErrors.date = 'Please select a date';
    }
    if (!bookingData.startTime) {
      newErrors.startTime = 'Please select a start time';
    }
    if (!bookingData.duration || parseFloat(bookingData.duration) < 0.5) {
      newErrors.duration = 'Minimum duration is 30 minutes';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!bookingData.subject) {
      newErrors.subject = 'Please select a subject';
    }
    if (bookingData.sessionType === 'in-person' && !bookingData.location) {
      newErrors.location = 'Location is required for in-person sessions';
    }
    if (bookingData.sessionType === 'online' && !bookingData.meetingLink) {
      newErrors.meetingLink = 'Meeting link is required for online sessions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!bookingData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the cancellation policy';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNext = () => {
    let isValid = false;
    if (step === 1) isValid = validateStep1();
    else if (step === 2) isValid = validateStep2();
    else if (step === 3) isValid = validateStep3();

    if (isValid) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const scheduledDateTime = new Date(`${bookingData.date}T${bookingData.startTime}`);

      const response = await axios.post(
        `${API_URL}/bookings`,
        {
          tutorId: selectedTutorId,
          subject: bookingData.subject,
          scheduledDate: scheduledDateTime,
          startTime: bookingData.startTime,
          endTime: getEndTime(),
          duration: duration,
          hourlyRate: tutorInfo.hourlyRate,
          totalCost: totalCost,
          sessionType: bookingData.sessionType,
          meetingLink: bookingData.meetingLink || null,
          location: bookingData.location || null,
          notes: bookingData.sessionNotes,
          paymentMethod: bookingData.paymentMethod
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/parent/bookings';
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Date & Time
  const renderStep1 = () => (
    <div className="booking-step">
      <h2>📅 Choose Date & Time</h2>
      <p className="step-subtitle">When would you like your first session?</p>

      <div className="form-group">
        <label htmlFor="date">Date *</label>
        <input
          id="date"
          name="date"
          type="date"
          min={getMinDate()}
          value={bookingData.date}
          onChange={handleInputChange}
        />
        {errors.date && <span className="error">{errors.date}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startTime">Start Time *</label>
          <select
            id="startTime"
            name="startTime"
            value={bookingData.startTime}
            onChange={handleInputChange}
          >
            <option value="">Select time...</option>
            {getTimeSlots().map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
          {errors.startTime && <span className="error">{errors.startTime}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="duration">Duration *</label>
          <select
            id="duration"
            name="duration"
            value={bookingData.duration}
            onChange={handleInputChange}
          >
            <option value="0.5">30 minutes</option>
            <option value="1">1 hour</option>
            <option value="1.5">1.5 hours</option>
            <option value="2">2 hours</option>
            <option value="2.5">2.5 hours</option>
            <option value="3">3 hours</option>
            <option value="4">4 hours</option>
          </select>
          {errors.duration && <span className="error">{errors.duration}</span>}
        </div>
      </div>

      {bookingData.startTime && (
        <div className="time-summary">
          <p>
            <strong>Session:</strong> {bookingData.date} from {bookingData.startTime} to {getEndTime()}
          </p>
          <p>
            <strong>Total Duration:</strong> {duration} hour{duration !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );

  // Step 2: Session Details
  const renderStep2 = () => (
    <div className="booking-step">
      <h2>📝 Session Details</h2>
      <p className="step-subtitle">Tell us about what you'll be working on</p>

      <div className="form-group">
        <label htmlFor="subject">Subject *</label>
        <select
          id="subject"
          name="subject"
          value={bookingData.subject}
          onChange={handleInputChange}
        >
          <option value="">Select subject...</option>
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
        {errors.subject && <span className="error">{errors.subject}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="sessionType">Session Type *</label>
        <select
          id="sessionType"
          name="sessionType"
          value={bookingData.sessionType}
          onChange={handleInputChange}
        >
          <option value="online">Online (Video Call)</option>
          <option value="in-person">In-Person</option>
        </select>
      </div>

      {bookingData.sessionType === 'online' ? (
        <div className="form-group">
          <label htmlFor="meetingLink">Meeting Link (Zoom, Google Meet, etc.) *</label>
          <input
            id="meetingLink"
            name="meetingLink"
            type="url"
            value={bookingData.meetingLink}
            onChange={handleInputChange}
            placeholder="https://zoom.us/j/..."
          />
          {errors.meetingLink && <span className="error">{errors.meetingLink}</span>}
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="location">Location *</label>
          <input
            id="location"
            name="location"
            type="text"
            value={bookingData.location}
            onChange={handleInputChange}
            placeholder="e.g., Coffee Shop, Library, Home..."
          />
          {errors.location && <span className="error">{errors.location}</span>}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="sessionNotes">Notes for Tutor (Optional)</label>
        <textarea
          id="sessionNotes"
          name="sessionNotes"
          value={bookingData.sessionNotes}
          onChange={handleInputChange}
          placeholder="e.g., Focus on quadratic equations, prepare for Chapter 5 test..."
          rows="4"
        />
      </div>
    </div>
  );

  // Step 3: Confirmation
  const renderStep3 = () => (
    <div className="booking-step">
      <h2>✓ Review & Confirm</h2>
      <p className="step-subtitle">Please review your booking details</p>

      <div className="booking-summary">
        <div className="summary-section">
          <h4>📚 Booking Details</h4>
          <p><strong>Tutor:</strong> {tutorInfo.name}</p>
          <p><strong>Date & Time:</strong> {bookingData.date} at {bookingData.startTime}</p>
          <p><strong>Duration:</strong> {duration} hour{duration !== 1 ? 's' : ''}</p>
          <p><strong>Subject:</strong> {bookingData.subject}</p>
          <p><strong>Type:</strong> {bookingData.sessionType === 'online' ? 'Online (Video)' : 'In-Person'}</p>
        </div>

        <div className="summary-section">
          <h4>💰 Payment Summary</h4>
          <div className="payment-breakdown">
            <div className="payment-row">
              <span>Hourly Rate:</span>
              <span>${tutorInfo.hourlyRate}/hr</span>
            </div>
            <div className="payment-row">
              <span>Duration:</span>
              <span>{duration} hours</span>
            </div>
            <div className="payment-row total">
              <span>Total Cost:</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
            <div className="payment-note">
              <p>Platform Fee (12%): ${platformFee.toFixed(2)}</p>
              <p>Tutor Earnings (88%): ${tutorEarns.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-item full-width">
          <input
            type="checkbox"
            checked={bookingData.agreeToTerms}
            onChange={(e) => setBookingData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
          />
          <span>I agree to the cancellation policy and terms</span>
        </label>
        {errors.agreeToTerms && <span className="error">{errors.agreeToTerms}</span>}
      </div>

      <div className="info-box">
        <p>💡 <strong>Payment:</strong> You'll be charged ${totalCost.toFixed(2)} when you confirm this booking. You can cancel up to 24 hours in advance for a full refund.</p>
      </div>

      {error && <div className="error-box">{error}</div>}
    </div>
  );

  if (success) {
    return (
      <div className="booking-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Booking Confirmed!</h2>
          <p>Your session with {tutorInfo.name} is booked.</p>
          <p>Check your email for confirmation and next steps.</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="booking-card">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <div className="progress-text">Step {step} of 3</div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <div className="button-group">
          {step > 1 && (
            <button className="btn-secondary" onClick={handlePrev} disabled={loading}>
              ← Previous
            </button>
          )}

          {step < 3 ? (
            <button className="btn-primary" onClick={handleNext} disabled={loading}>
              Next →
            </button>
          ) : (
            <button
              className="btn-primary btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Confirm & Pay $${totalCost.toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
