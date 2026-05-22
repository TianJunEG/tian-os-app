import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tutorsAPI } from '../services/api';
import './TutorOnboarding.css';

const TutorOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    specialties: [],
    gradeLevel: [],
    hourlyRate: '',
    bio: '',

    // Step 2: Qualifications
    education: '',
    experience: '',
    certifications: '',
    credentials: null,

    // Step 3: Availability
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '16:00', available: false },
      sunday: { start: '10:00', end: '16:00', available: false }
    },

    // Step 4: Banking
    bankAccountName: '',
    bankRoutingNumber: '',
    bankAccountNumber: '',
    accountType: 'checking',

    // Step 5: Review
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});

  // Subject options
  const subjects = [
    'Mathematics', 'English', 'Science', 'Biology', 'Chemistry', 'Physics',
    'History', 'Geography', 'Economics', 'Spanish', 'French', 'Chinese',
    'SAT Prep', 'ACT Prep', 'AP Exam Prep', 'GMAT', 'GRE', 'Music',
    'Art', 'Computer Science', 'Programming'
  ];

  const grades = [
    'K-2', 'Grade 3-5', 'Grade 6-8', 'Grade 9-10', 'Grade 11-12', 'College', 'Adult'
  ];

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.specialties.length) {
      newErrors.specialties = 'Select at least one subject';
    }
    if (!formData.gradeLevel.length) {
      newErrors.gradeLevel = 'Select at least one grade level';
    }
    if (!formData.hourlyRate || parseFloat(formData.hourlyRate) < 10) {
      newErrors.hourlyRate = 'Rate must be at least $10/hour';
    }
    if (!formData.bio || formData.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.education) {
      newErrors.education = 'Education level is required';
    }
    if (!formData.experience || formData.experience < 0) {
      newErrors.experience = 'Years of experience required';
    }
    if (!formData.credentials) {
      newErrors.credentials = 'Please upload your credentials document';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors = {};
    if (!formData.bankAccountName) {
      newErrors.bankAccountName = 'Account holder name is required';
    }
    if (!formData.bankRoutingNumber || formData.bankRoutingNumber.length !== 9) {
      newErrors.bankRoutingNumber = 'Invalid routing number (9 digits)';
    }
    if (!formData.bankAccountNumber || formData.bankAccountNumber.length < 8) {
      newErrors.bankAccountNumber = 'Invalid account number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = () => {
    const newErrors = {};
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle inputs
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
      specialties: prev.specialties.includes(subject)
        ? prev.specialties.filter(s => s !== subject)
        : [...prev.specialties, subject]
    }));
  };

  const handleGradeToggle = (grade) => {
    setFormData(prev => ({
      ...prev,
      gradeLevel: prev.gradeLevel.includes(grade)
        ? prev.gradeLevel.filter(g => g !== grade)
        : [...prev.gradeLevel, grade]
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({ ...prev, credentials: 'File must be smaller than 5MB' }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      credentials: file
    }));
    if (errors.credentials) {
      setErrors(prev => ({ ...prev, credentials: '' }));
    }
  };

  const handleNext = () => {
    let isValid = false;

    if (step === 1) isValid = validateStep1();
    else if (step === 2) isValid = validateStep2();
    else if (step === 3) isValid = true; // Availability is optional
    else if (step === 4) isValid = validateStep4();
    else if (step === 5) isValid = validateStep5();

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
    if (!validateStep5()) return;

    setLoading(true);
    setError('');

    try {
      // Upload credentials file first
      let credentialsUrl = null;
      if (formData.credentials) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.credentials);

        // Simulate file upload (in real app, use S3 or similar)
        credentialsUrl = `/credentials/${Date.now()}-${formData.credentials.name}`;
      }

      // Submit tutor profile
      const response = await tutorsAPI.completeOnboarding({
        specialties: formData.specialties,
        gradeLevel: formData.gradeLevel,
        hourlyRate: parseFloat(formData.hourlyRate),
        bio: formData.bio,
        education: formData.education,
        experience: parseInt(formData.experience),
        certifications: formData.certifications,
        credentialsUrl,
        availability: formData.availability,
        bankingInfo: {
          accountName: formData.bankAccountName,
          routingNumber: formData.bankRoutingNumber,
          accountNumber: formData.bankAccountNumber,
          accountType: formData.accountType
        }
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Basic Info
  const renderStep1 = () => (
    <div className="onboarding-step">
      <h2>📚 What Do You Teach?</h2>
      <p className="step-subtitle">Select your specialties (choose at least one)</p>

      <div className="form-group">
        <label>Subjects</label>
        <div className="checkbox-grid">
          {subjects.map(subject => (
            <label key={subject} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.specialties.includes(subject)}
                onChange={() => handleSubjectToggle(subject)}
              />
              <span>{subject}</span>
            </label>
          ))}
        </div>
        {errors.specialties && <span className="error">{errors.specialties}</span>}
      </div>

      <div className="form-group">
        <label>Grade Levels You Teach</label>
        <div className="checkbox-grid">
          {grades.map(grade => (
            <label key={grade} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.gradeLevel.includes(grade)}
                onChange={() => handleGradeToggle(grade)}
              />
              <span>{grade}</span>
            </label>
          ))}
        </div>
        {errors.gradeLevel && <span className="error">{errors.gradeLevel}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="hourlyRate">Hourly Rate ($)</label>
          <input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            min="10"
            max="200"
            step="5"
            value={formData.hourlyRate}
            onChange={handleInputChange}
            placeholder="e.g., 50"
          />
          {errors.hourlyRate && <span className="error">{errors.hourlyRate}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="bio">About You (Your Teaching Philosophy)</label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          placeholder="Tell parents about your teaching style, experience, and approach..."
          rows="5"
        />
        <div className="char-count">
          {formData.bio.length}/500 characters (minimum 50)
        </div>
        {errors.bio && <span className="error">{errors.bio}</span>}
      </div>
    </div>
  );

  // Step 2: Qualifications
  const renderStep2 = () => (
    <div className="onboarding-step">
      <h2>🎓 Your Qualifications</h2>
      <p className="step-subtitle">Tell us about your background</p>

      <div className="form-group">
        <label htmlFor="education">Highest Education Level</label>
        <select
          id="education"
          name="education"
          value={formData.education}
          onChange={handleInputChange}
        >
          <option value="">Select...</option>
          <option value="high_school">High School</option>
          <option value="associates">Associate's Degree</option>
          <option value="bachelors">Bachelor's Degree</option>
          <option value="masters">Master's Degree</option>
          <option value="phd">PhD/Doctorate</option>
        </select>
        {errors.education && <span className="error">{errors.education}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="experience">Years of Teaching Experience</label>
        <input
          id="experience"
          name="experience"
          type="number"
          min="0"
          max="50"
          value={formData.experience}
          onChange={handleInputChange}
          placeholder="e.g., 5"
        />
        {errors.experience && <span className="error">{errors.experience}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="certifications">Certifications or Licenses (Optional)</label>
        <input
          id="certifications"
          name="certifications"
          type="text"
          value={formData.certifications}
          onChange={handleInputChange}
          placeholder="e.g., TEFL, PGCE, State Teaching License..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="credentials">Upload Credentials Document</label>
        <div className="file-upload-box">
          <input
            id="credentials"
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx"
          />
          <span className="file-hint">
            {formData.credentials
              ? `✓ ${formData.credentials.name}`
              : 'Upload degree, certificate, or teaching license (PDF, DOC, DOCX - max 5MB)'}
          </span>
        </div>
        {errors.credentials && <span className="error">{errors.credentials}</span>}
      </div>

      <div className="info-box">
        <p>💡 <strong>Tip:</strong> Upload clear documents showing your qualifications. This helps you get verified faster!</p>
      </div>
    </div>
  );

  // Step 3: Availability
  const renderStep3 = () => (
    <div className="onboarding-step">
      <h2>⏰ Your Availability</h2>
      <p className="step-subtitle">Set your typical hours (you can adjust per session later)</p>

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

      <div className="info-box">
        <p>💡 <strong>Note:</strong> This is optional. You can leave it blank and adjust availability per session.</p>
      </div>
    </div>
  );

  // Step 4: Banking
  const renderStep4 = () => (
    <div className="onboarding-step">
      <h2>🏦 Banking Information</h2>
      <p className="step-subtitle">Where should we send your earnings?</p>

      <div className="info-box warning">
        <p>🔒 <strong>Secure:</strong> Your banking information is encrypted and only used for payouts. We never charge your account.</p>
      </div>

      <div className="form-group">
        <label htmlFor="bankAccountName">Account Holder Name</label>
        <input
          id="bankAccountName"
          name="bankAccountName"
          type="text"
          value={formData.bankAccountName}
          onChange={handleInputChange}
          placeholder="Name as it appears on your bank account"
        />
        {errors.bankAccountName && <span className="error">{errors.bankAccountName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="accountType">Account Type</label>
        <select
          id="accountType"
          name="accountType"
          value={formData.accountType}
          onChange={handleInputChange}
        >
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="bankRoutingNumber">Routing Number</label>
        <input
          id="bankRoutingNumber"
          name="bankRoutingNumber"
          type="text"
          value={formData.bankRoutingNumber}
          onChange={handleInputChange}
          placeholder="9-digit routing number"
          maxLength="9"
        />
        {errors.bankRoutingNumber && <span className="error">{errors.bankRoutingNumber}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="bankAccountNumber">Account Number</label>
        <input
          id="bankAccountNumber"
          name="bankAccountNumber"
          type="password"
          value={formData.bankAccountNumber}
          onChange={handleInputChange}
          placeholder="Your account number"
        />
        {errors.bankAccountNumber && <span className="error">{errors.bankAccountNumber}</span>}
      </div>

      <div className="info-box">
        <p>💡 <strong>Find your details:</strong> Check a check, online banking portal, or call your bank. Routing number is on the left side of your checks.</p>
      </div>
    </div>
  );

  // Step 5: Review
  const renderStep5 = () => (
    <div className="onboarding-step">
      <h2>✓ Review Your Application</h2>
      <p className="step-subtitle">Make sure everything looks correct</p>

      <div className="review-section">
        <h3>📚 Teaching Info</h3>
        <p><strong>Subjects:</strong> {formData.specialties.join(', ')}</p>
        <p><strong>Grades:</strong> {formData.gradeLevel.join(', ')}</p>
        <p><strong>Rate:</strong> ${formData.hourlyRate}/hour</p>
      </div>

      <div className="review-section">
        <h3>🎓 Qualifications</h3>
        <p><strong>Education:</strong> {formData.education}</p>
        <p><strong>Experience:</strong> {formData.experience} years</p>
        {formData.certifications && <p><strong>Certifications:</strong> {formData.certifications}</p>}
        <p><strong>Credentials:</strong> {formData.credentials ? '✓ Uploaded' : 'Not uploaded'}</p>
      </div>

      <div className="review-section">
        <h3>🏦 Payout Details</h3>
        <p><strong>Account Holder:</strong> {formData.bankAccountName}</p>
        <p><strong>Account Type:</strong> {formData.accountType}</p>
        <p><strong>Routing #:</strong> {formData.bankRoutingNumber}</p>
      </div>

      <label className="checkbox-item full-width">
        <input
          type="checkbox"
          checked={formData.agreeToTerms}
          onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
        />
        <span>I agree to the Terms of Service and confirm all information is accurate</span>
      </label>
      {errors.agreeToTerms && <span className="error">{errors.agreeToTerms}</span>}

      {error && <div className="error-box">{error}</div>}
    </div>
  );

  if (success) {
    return (
      <div className="onboarding-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Application Submitted!</h2>
          <p>Thank you for applying to become a tutor on AEO.</p>
          <p>We're reviewing your application and will notify you within 24-48 hours.</p>
          <p>Check your email for updates!</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
        </div>

        <div className="progress-text">
          Step {step} of 5
        </div>

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}

        {/* Navigation Buttons */}
        <div className="button-group">
          {step > 1 && (
            <button
              className="btn-secondary"
              onClick={handlePrev}
              disabled={loading}
            >
              ← Previous
            </button>
          )}

          {step < 5 ? (
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={loading}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn-primary btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorOnboarding;
