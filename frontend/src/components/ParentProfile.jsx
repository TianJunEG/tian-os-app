import React, { useState } from 'react';
import axios from 'axios';
import './ParentProfile.css';

const ParentProfile = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const API_URL = 'http://localhost:5001/api';
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  const [formData, setFormData] = useState({
    // Step 1: Student Info
    studentName: '',
    studentAge: '',
    gradeLevel: '',

    // Step 2: Learning Goals
    primarySubject: '',
    otherSubjects: [],
    learningGoals: '',
    specificChallenges: '',

    // Step 3: Preferences
    preferredTutorGender: 'any',
    learningStyle: 'adaptive',
    preferredSessionType: 'online',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    budget: '',

    // Step 4: Availability
    availability: {
      monday: { available: false, start: '16:00', end: '18:00' },
      tuesday: { available: false, start: '16:00', end: '18:00' },
      wednesday: { available: false, start: '16:00', end: '18:00' },
      thursday: { available: false, start: '16:00', end: '18:00' },
      friday: { available: false, start: '16:00', end: '18:00' },
      saturday: { available: true, start: '10:00', end: '14:00' },
      sunday: { available: true, start: '10:00', end: '14:00' }
    },

    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});

  const subjects = [
    'Mathematics', 'English', 'Science', 'Biology', 'Chemistry', 'Physics',
    'History', 'Geography', 'Economics', 'Spanish', 'French', 'Chinese',
    'SAT Prep', 'ACT Prep', 'AP Exam Prep', 'Music', 'Art', 'Computer Science'
  ];

  const grades = [
    'K-2', 'Grade 3-5', 'Grade 6-8', 'Grade 9-10', 'Grade 11-12', 'College'
  ];

  // Validation
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.studentName || formData.studentName.length < 2) {
      newErrors.studentName = 'Student name is required';
    }
    if (!formData.studentAge || formData.studentAge < 5 || formData.studentAge > 80) {
      newErrors.studentAge = 'Please enter a valid age';
    }
    if (!formData.gradeLevel) {
      newErrors.gradeLevel = 'Grade level is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.primarySubject) {
      newErrors.primarySubject = 'Primary subject is required';
    }
    if (!formData.learningGoals || formData.learningGoals.length < 20) {
      newErrors.learningGoals = 'Learning goals must be at least 20 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.budget || parseFloat(formData.budget) < 10) {
      newErrors.budget = 'Budget must be at least $10/hour';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors = {};
    const hasAvailability = Object.values(formData.availability).some(day => day.available);
    if (!hasAvailability) {
      newErrors.availability = 'Please select at least one available time slot';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      otherSubjects: prev.otherSubjects.includes(subject)
        ? prev.otherSubjects.filter(s => s !== subject)
        : [...prev.otherSubjects, subject]
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  const handleNext = () => {
    let isValid = false;
    if (step === 1) isValid = validateStep1();
    else if (step === 2) isValid = validateStep2();
    else if (step === 3) isValid = validateStep3();
    else if (step === 4) isValid = validateStep4();

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
      const response = await axios.post(
        `${API_URL}/parents/profile`,
        {
          userId,
          studentName: formData.studentName,
          studentAge: parseInt(formData.studentAge),
          gradeLevel: formData.gradeLevel,
          primarySubject: formData.primarySubject,
          otherSubjects: formData.otherSubjects,
          learningGoals: formData.learningGoals,
          specificChallenges: formData.specificChallenges,
          preferredTutorGender: formData.preferredTutorGender,
          learningStyle: formData.learningStyle,
          preferredSessionType: formData.preferredSessionType,
          timezone: formData.timezone,
          budget: parseFloat(formData.budget),
          availability: formData.availability
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
          onComplete && onComplete();
          window.location.href = '/search';
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="profile-step">
      <h2>👨‍🎓 Tell Us About Your Student</h2>
      <p className="step-subtitle">Basic information about who needs tutoring</p>

      <div className="form-group">
        <label htmlFor="studentName">Student's Name</label>
        <input
          id="studentName"
          name="studentName"
          type="text"
          value={formData.studentName}
          onChange={handleInputChange}
          placeholder="e.g., Sarah"
        />
        {errors.studentName && <span className="error">{errors.studentName}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="studentAge">Age</label>
          <input
            id="studentAge"
            name="studentAge"
            type="number"
            min="5"
            max="80"
            value={formData.studentAge}
            onChange={handleInputChange}
            placeholder="e.g., 14"
          />
          {errors.studentAge && <span className="error">{errors.studentAge}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="gradeLevel">Grade Level</label>
          <select
            id="gradeLevel"
            name="gradeLevel"
            value={formData.gradeLevel}
            onChange={handleInputChange}
          >
            <option value="">Select...</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          {errors.gradeLevel && <span className="error">{errors.gradeLevel}</span>}
        </div>
      </div>

      <div className="info-box">
        <p>💡 This helps us match you with tutors who specialize in your student's age group.</p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="profile-step">
      <h2>📚 What Subjects Need Help?</h2>
      <p className="step-subtitle">Select the primary subject and any additional ones</p>

      <div className="form-group">
        <label>Primary Subject *</label>
        <select
          value={formData.primarySubject}
          onChange={(e) => setFormData(prev => ({ ...prev, primarySubject: e.target.value }))}
          className="form-select"
        >
          <option value="">Choose primary subject...</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
        {errors.primarySubject && <span className="error">{errors.primarySubject}</span>}
      </div>

      <div className="form-group">
        <label>Additional Subjects (Optional)</label>
        <div className="checkbox-grid">
          {subjects.map(subject => (
            <label key={subject} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.otherSubjects.includes(subject)}
                onChange={() => handleSubjectToggle(subject)}
              />
              <span>{subject}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="learningGoals">Learning Goals *</label>
        <textarea
          id="learningGoals"
          name="learningGoals"
          value={formData.learningGoals}
          onChange={handleInputChange}
          placeholder="e.g., Improve grade from C to A, prepare for SAT, understand algebra concepts..."
          rows="3"
        />
        {errors.learningGoals && <span className="error">{errors.learningGoals}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="specificChallenges">Specific Challenges (Optional)</label>
        <textarea
          id="specificChallenges"
          name="specificChallenges"
          value={formData.specificChallenges}
          onChange={handleInputChange}
          placeholder="e.g., Struggles with word problems, test anxiety, slow reading speed..."
          rows="3"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="profile-step">
      <h2>🎯 Your Preferences</h2>
      <p className="step-subtitle">Help us find the perfect tutor match</p>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="learningStyle">Learning Style</label>
          <select
            id="learningStyle"
            name="learningStyle"
            value={formData.learningStyle}
            onChange={handleInputChange}
          >
            <option value="adaptive">Adaptive (adjust to student)</option>
            <option value="visual">Visual Learner</option>
            <option value="auditory">Auditory Learner</option>
            <option value="kinesthetic">Kinesthetic Learner</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="preferredSessionType">Session Type</label>
          <select
            id="preferredSessionType"
            name="preferredSessionType"
            value={formData.preferredSessionType}
            onChange={handleInputChange}
          >
            <option value="online">Online</option>
            <option value="in-person">In-Person</option>
            <option value="hybrid">Either</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="preferredTutorGender">Tutor Gender (Optional)</label>
          <select
            id="preferredTutorGender"
            name="preferredTutorGender"
            value={formData.preferredTutorGender}
            onChange={handleInputChange}
          >
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="budget">Budget ($/hour) *</label>
          <input
            id="budget"
            name="budget"
            type="number"
            min="10"
            max="200"
            step="5"
            value={formData.budget}
            onChange={handleInputChange}
            placeholder="e.g., 50"
          />
          {errors.budget && <span className="error">{errors.budget}</span>}
        </div>
      </div>

      <div className="info-box">
        <p>💡 <strong>Budget tip:</strong> Most tutors charge $30-75/hour. Setting a higher budget increases your match options.</p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="profile-step">
      <h2>⏰ When Can You Schedule Sessions?</h2>
      <p className="step-subtitle">Your preferred tutoring times</p>

      <div className="availability-grid">
        {Object.entries(formData.availability).map(([day, times]) => (
          <div key={day} className="availability-day">
            <label className="day-checkbox">
              <input
                type="checkbox"
                checked={times.available}
                onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
              />
              <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
            </label>

            {times.available && (
              <div className="day-times">
                <div className="time-input">
                  <label>From</label>
                  <input
                    type="time"
                    value={times.start}
                    onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                  />
                </div>
                <div className="time-input">
                  <label>To</label>
                  <input
                    type="time"
                    value={times.end}
                    onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {errors.availability && <span className="error">{errors.availability}</span>}

      <div className="form-group" style={{ marginTop: '24px' }}>
        <label className="checkbox-item full-width">
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
          />
          <span>I agree to the Terms of Service and understand tutor availability may vary</span>
        </label>
        {errors.agreeToTerms && <span className="error">{errors.agreeToTerms}</span>}
      </div>

      {error && <div className="error-box">{error}</div>}
    </div>
  );

  if (success) {
    return (
      <div className="profile-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Profile Complete!</h2>
          <p>Your profile is all set. Let's find the perfect tutor for you!</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        <div className="progress-text">Step {step} of 4</div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <div className="button-group">
          {step > 1 && (
            <button className="btn-secondary" onClick={handlePrev} disabled={loading}>
              ← Previous
            </button>
          )}

          {step < 4 ? (
            <button className="btn-primary" onClick={handleNext} disabled={loading}>
              Next →
            </button>
          ) : (
            <button
              className="btn-primary btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Find Tutors'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentProfile;
