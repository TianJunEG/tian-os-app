import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentsAPI } from '../services/api';
import { ProgressBar, Spinner, Alert } from './ui/index.jsx';

const ParentProfile = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      const response = await parentsAPI.createProfile({
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
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onComplete && onComplete();
          navigate('/search');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-xl bg-surface-white text-base sm:text-sm text-ink-700 placeholder:text-ink-300 border border-line-soft h-11 px-3.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 focus-visible:border-navy-400';
  const selectCls = `${inputCls} appearance-none pr-10`;

  const renderStep1 = () => (
    <div className="ds-wizard-step">
      <h2 className="text-2xl font-bold text-ink-700 mb-2">👨‍🎓 Tell Us About Your Student</h2>
      <p className="text-sm text-ink-500 mb-6">Basic information about who needs tutoring</p>

      <div className="ds-form-group">
        <label htmlFor="studentName" className="ds-form-label">Student's Name</label>
        <input
          id="studentName"
          name="studentName"
          type="text"
          className={inputCls}
          value={formData.studentName}
          onChange={handleInputChange}
          placeholder="e.g., Sarah"
        />
        {errors.studentName && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.studentName}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="ds-form-group">
          <label htmlFor="studentAge" className="ds-form-label">Age</label>
          <input
            id="studentAge"
            name="studentAge"
            type="number"
            min="5"
            max="80"
            className={inputCls}
            value={formData.studentAge}
            onChange={handleInputChange}
            placeholder="e.g., 14"
          />
          {errors.studentAge && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.studentAge}</p>}
        </div>

        <div className="ds-form-group">
          <label htmlFor="gradeLevel" className="ds-form-label">Grade Level</label>
          <select
            id="gradeLevel"
            name="gradeLevel"
            className={selectCls}
            value={formData.gradeLevel}
            onChange={handleInputChange}
          >
            <option value="">Select...</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          {errors.gradeLevel && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.gradeLevel}</p>}
        </div>
      </div>

      <Alert tone="info" className="mt-4">
        💡 This helps us match you with tutors who specialize in your student's age group.
      </Alert>
    </div>
  );

  const renderStep2 = () => (
    <div className="ds-wizard-step">
      <h2 className="text-2xl font-bold text-ink-700 mb-2">📚 What Subjects Need Help?</h2>
      <p className="text-sm text-ink-500 mb-6">Select the primary subject and any additional ones</p>

      <div className="ds-form-group">
        <label className="ds-form-label">Primary Subject *</label>
        <select
          className={selectCls}
          value={formData.primarySubject}
          onChange={(e) => setFormData(prev => ({ ...prev, primarySubject: e.target.value }))}
        >
          <option value="">Choose primary subject...</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
        {errors.primarySubject && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.primarySubject}</p>}
      </div>

      <div className="ds-form-group">
        <label className="ds-form-label">Additional Subjects (Optional)</label>
        <div className="ds-checkbox-grid">
          {subjects.map(subject => (
            <label key={subject} className="ds-checkbox-item">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line-soft accent-navy-700"
                checked={formData.otherSubjects.includes(subject)}
                onChange={() => handleSubjectToggle(subject)}
              />
              <span className="text-sm text-ink-700">{subject}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="ds-form-group">
        <label htmlFor="learningGoals" className="ds-form-label">Learning Goals *</label>
        <textarea
          id="learningGoals"
          name="learningGoals"
          className="w-full rounded-xl bg-surface-white text-base sm:text-sm text-ink-700 placeholder:text-ink-300 border border-line-soft px-3.5 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 focus-visible:border-navy-400 resize-y"
          value={formData.learningGoals}
          onChange={handleInputChange}
          placeholder="e.g., Improve grade from C to A, prepare for SAT, understand algebra concepts..."
          rows="3"
        />
        {errors.learningGoals && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.learningGoals}</p>}
      </div>

      <div className="ds-form-group">
        <label htmlFor="specificChallenges" className="ds-form-label">Specific Challenges (Optional)</label>
        <textarea
          id="specificChallenges"
          name="specificChallenges"
          className="w-full rounded-xl bg-surface-white text-base sm:text-sm text-ink-700 placeholder:text-ink-300 border border-line-soft px-3.5 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 focus-visible:border-navy-400 resize-y"
          value={formData.specificChallenges}
          onChange={handleInputChange}
          placeholder="e.g., Struggles with word problems, test anxiety, slow reading speed..."
          rows="3"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="ds-wizard-step">
      <h2 className="text-2xl font-bold text-ink-700 mb-2">🎯 Your Preferences</h2>
      <p className="text-sm text-ink-500 mb-6">Help us find the perfect tutor match</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="ds-form-group">
          <label htmlFor="learningStyle" className="ds-form-label">Learning Style</label>
          <select
            id="learningStyle"
            name="learningStyle"
            className={selectCls}
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

        <div className="ds-form-group">
          <label htmlFor="preferredSessionType" className="ds-form-label">Session Type</label>
          <select
            id="preferredSessionType"
            name="preferredSessionType"
            className={selectCls}
            value={formData.preferredSessionType}
            onChange={handleInputChange}
          >
            <option value="online">Online</option>
            <option value="in-person">In-Person</option>
            <option value="hybrid">Either</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="ds-form-group">
          <label htmlFor="preferredTutorGender" className="ds-form-label">Tutor Gender (Optional)</label>
          <select
            id="preferredTutorGender"
            name="preferredTutorGender"
            className={selectCls}
            value={formData.preferredTutorGender}
            onChange={handleInputChange}
          >
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="ds-form-group">
          <label htmlFor="budget" className="ds-form-label">Budget ($/hour) *</label>
          <input
            id="budget"
            name="budget"
            type="number"
            min="10"
            max="200"
            step="5"
            className={inputCls}
            value={formData.budget}
            onChange={handleInputChange}
            placeholder="e.g., 50"
          />
          {errors.budget && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.budget}</p>}
        </div>
      </div>

      <Alert tone="info" className="mt-4">
        💡 <strong>Budget tip:</strong> Most tutors charge $30-75/hour. Setting a higher budget increases your match options.
      </Alert>
    </div>
  );

  const renderStep4 = () => (
    <div className="ds-wizard-step">
      <h2 className="text-2xl font-bold text-ink-700 mb-2">⏰ When Can You Schedule Sessions?</h2>
      <p className="text-sm text-ink-500 mb-6">Your preferred tutoring times</p>

      <div className="ds-availability-grid">
        {Object.entries(formData.availability).map(([day, times]) => (
          <div key={day} className="ds-availability-day">
            <label className="flex items-center gap-2 mb-3 cursor-pointer font-semibold text-ink-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line-soft accent-navy-700"
                checked={times.available}
                onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
              />
              <span className="capitalize">{day}</span>
            </label>

            {times.available && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink-500">From</label>
                  <input
                    type="time"
                    className={`${inputCls} h-9 text-sm`}
                    value={times.start}
                    onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink-500">To</label>
                  <input
                    type="time"
                    className={`${inputCls} h-9 text-sm`}
                    value={times.end}
                    onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {errors.availability && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.availability}</p>}

      <div className="ds-form-group mt-6">
        <label className="ds-checkbox-item">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line-soft accent-navy-700"
            checked={formData.agreeToTerms}
            onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
          />
          <span className="text-sm text-ink-700">I agree to the Terms of Service and understand tutor availability may vary</span>
        </label>
        {errors.agreeToTerms && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.agreeToTerms}</p>}
      </div>

      {error && <Alert tone="error" className="mt-4">{error}</Alert>}
    </div>
  );

  if (success) {
    return (
      <div className="ds-wizard-shell">
        <div className="flex flex-col items-center gap-4 text-center py-16 px-10">
          <span className="text-[80px] text-success-500">✓</span>
          <h2 className="text-2xl font-bold text-ink-700">Profile Complete!</h2>
          <p className="text-sm text-ink-500">Your profile is all set. Let's find the perfect tutor for you!</p>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="ds-wizard-shell">
      <div className="ds-wizard-card">
        <ProgressBar value={step} max={4} barClassName="bg-emerald-deep" className="rounded-none" />

        <div className="text-center text-xs font-semibold text-ink-500 py-3 border-b border-line-soft">
          Step {step} of 4
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <div className="ds-wizard-footer">
          {step > 1 && (
            <button
              className="flex-1 h-12 px-5 text-[15px] font-semibold rounded-btn border border-line-soft bg-surface-white text-emerald-deep transition hover:bg-emerald-tint disabled:opacity-50"
              onClick={handlePrev}
              disabled={loading}
            >
              ← Previous
            </button>
          )}

          {step < 4 ? (
            <button
              className="flex-1 h-12 px-5 text-[15px] font-semibold rounded-btn bg-emerald-deep text-white transition hover:bg-emerald-deep disabled:opacity-50"
              onClick={handleNext}
              disabled={loading}
            >
              Next →
            </button>
          ) : (
            <button
              className="flex-1 h-12 px-5 text-[15px] font-semibold rounded-btn bg-success-500 text-white transition hover:bg-success-700 disabled:opacity-50"
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
