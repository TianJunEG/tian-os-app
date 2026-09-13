import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tutorsAPI } from '../services/api';
import { ProgressBar, Spinner, Alert } from './ui/index.jsx';

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
    if (file && file.size > 5 * 1024 * 1024) {
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
    else if (step === 3) isValid = true;
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
      let credentialsUrl = null;
      if (formData.credentials) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.credentials);
        credentialsUrl = `/credentials/${Date.now()}-${formData.credentials.name}`;
      }

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

  const inputCls = 'w-full rounded-xl bg-surface-white text-base sm:text-sm text-ink-700 placeholder:text-ink-300 border border-line-soft h-11 px-3.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:border-navy-400';
  const selectCls = `${inputCls} appearance-none pr-10`;
  const textareaCls = 'w-full rounded-xl bg-surface-white text-base sm:text-sm text-ink-700 placeholder:text-ink-300 border border-line-soft px-3.5 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:border-navy-400 resize-y';

  // Step 1: Basic Info
  const renderStep1 = () => (
    <div className="ds-wizard-step">
      <h2 className="text-2xl font-bold text-ink-700 mb-2">📚 What Do You Teach?</h2>
      <p className="text-sm text-ink-500 mb-6">Select your specialties (choose at least one)</p>

      <div className="ds-form-group">
        <label className="ds-form-label">Subjects</label>
        <div className="ds-checkbox-grid">
          {subjects.map(subject => (
            <label key={subject} className="ds-checkbox-item">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line-soft accent-navy-700"
                checked={formData.specialties.includes(subject)}
                onChange={() => handleSubjectToggle(subject)}
              />
              <span className="text-sm text-ink-700">{subject}</span>
            </label>
          ))}
        </div>
        {errors.specialties && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.specialties}</p>}
      </div>

      <div className="ds-form-group">
        <label className="ds-form-label">Grade Levels You Teach</label>
        <div className="ds-checkbox-grid">
          {grades.map(grade => (
            <label key={grade} className="ds-checkbox-item">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line-soft accent-navy-700"
                checked={formData.gradeLevel.includes(grade)}
                onChange={() => handleGradeToggle(grade)}
              />
              <span className="text-sm text-ink-700">{grade}</span>
            </label>
          ))}
        </div>
        {errors.gradeLevel && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.gradeLevel}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="ds-form-group">
          <label htmlFor="hourlyRate" className="ds-form-label">Hourly Rate ($)</label>
          <input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            min="10"
            max="200"
            step="5"
            className={inputCls}
            value={formData.hourlyRate}
            onChange={handleInputChange}
            placeholder="e.g., 50"
          />
          {errors.hourlyRate && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.hourlyRate}</p>}
        </div>
      </div>

      <div className="ds-form-group">
        <label htmlFor="bio" className="ds-form-label">About You (Your Teaching Philosophy)</label>
        <textarea
          id="bio"
          name="bio"
          className={textareaCls}
          value={formData.bio}
          onChange={handleInputChange}
          placeholder="Tell parents about your teaching style, experience, and approach..."
          rows="5"
        />
        <span className="text-xs text-ink-300 mt-1.5 block">
          {formData.bio.length}/500 characters (minimum 50)
        </span>
        {errors.bio && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.bio}</p>}
      </div>
    </div>
  );

  // Step 2: Qualifications
  const renderStep2 = () => (
    <div className="ds-wizard-step">
      <h2 className="text-2xl font-bold text-ink-700 mb-2">🎓 Your Qualifications</h2>
      <p className="text-sm text-ink-500 mb-6">Tell us about your background</p>

      <div className="ds-form-group">
        <label htmlFor="education" className="ds-form-label">Highest Education Level</label>
        <select
          id="education"
          name="education"
          className={selectCls}
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
        {errors.education && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.education}</p>}
      </div>

      <div className="ds-form-group">
        <label htmlFor="experience" className="ds-form-label">Years of Teaching Experience</label>
        <input
          id="experience"
          name="experience"
          type="number"
          min="0"
          max="50"
          className={inputCls}
          value={formData.experience}
          onChange={handleInputChange}
          placeholder="e.g., 5"
        />
        {errors.experience && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.experience}</p>}
      </div>

      <div className="ds-form-group">
        <label htmlFor="certifications" className="ds-form-label">Certifications or Licenses (Optional)</label>
        <input
          id="certifications"
          name="certifications"
          type="text"
          className={inputCls}
          value={formData.certifications}
          onChange={handleInputChange}
          placeholder="e.g., TEFL, PGCE, State Teaching License..."
        />
      </div>

      <div className="ds-form-group">
        <label htmlFor="credentials" className="ds-form-label">Upload Credentials Document</label>
        <div className="flex items-center gap-4 p-5 rounded-xl border-2 border-dashed border-line-soft bg-emerald-tint/30 transition hover:border-navy-300 cursor-pointer">
          <input
            id="credentials"
            type="file"
            className="text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-deep file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-deep"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx"
          />
          <span className="text-xs text-ink-500">
            {formData.credentials
              ? `✓ ${formData.credentials.name}`
              : 'PDF, DOC, DOCX — max 5MB'}
          </span>
        </div>
        {errors.credentials && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.credentials}</p>}
      </div>

      <Alert tone="info" className="mt-4">
        💡 <strong>Tip:</strong> Upload clear documents showing your qualifications. This helps you get verified faster!
      </Alert>
    </div>
  );

  // Step 3: Availability
  const renderStep3 = () => (
    <div className="ds-wizard-step">
      <h2 className="text-2xl font-bold text-ink-700 mb-2">⏰ Your Availability</h2>
      <p className="text-sm text-ink-500 mb-6">Set your typical hours (you can adjust per session later)</p>

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

      <Alert tone="info" className="mt-4">
        💡 <strong>Note:</strong> This is optional. You can leave it blank and adjust availability per session.
      </Alert>
    </div>
  );

  // Step 4: Banking
  const renderStep4 = () => (
    <div className="ds-wizard-step">
      <h2 className="text-2xl font-bold text-ink-700 mb-2">🏦 Banking Information</h2>
      <p className="text-sm text-ink-500 mb-6">Where should we send your earnings?</p>

      <Alert tone="warning" className="mb-6">
        🔒 <strong>Secure:</strong> Your banking information is encrypted and only used for payouts. We never charge your account.
      </Alert>

      <div className="ds-form-group">
        <label htmlFor="bankAccountName" className="ds-form-label">Account Holder Name</label>
        <input
          id="bankAccountName"
          name="bankAccountName"
          type="text"
          className={inputCls}
          value={formData.bankAccountName}
          onChange={handleInputChange}
          placeholder="Name as it appears on your bank account"
        />
        {errors.bankAccountName && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.bankAccountName}</p>}
      </div>

      <div className="ds-form-group">
        <label htmlFor="accountType" className="ds-form-label">Account Type</label>
        <select
          id="accountType"
          name="accountType"
          className={selectCls}
          value={formData.accountType}
          onChange={handleInputChange}
        >
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
      </div>

      <div className="ds-form-group">
        <label htmlFor="bankRoutingNumber" className="ds-form-label">Routing Number</label>
        <input
          id="bankRoutingNumber"
          name="bankRoutingNumber"
          type="text"
          className={inputCls}
          value={formData.bankRoutingNumber}
          onChange={handleInputChange}
          placeholder="9-digit routing number"
          maxLength="9"
        />
        {errors.bankRoutingNumber && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.bankRoutingNumber}</p>}
      </div>

      <div className="ds-form-group">
        <label htmlFor="bankAccountNumber" className="ds-form-label">Account Number</label>
        <input
          id="bankAccountNumber"
          name="bankAccountNumber"
          type="password"
          className={inputCls}
          value={formData.bankAccountNumber}
          onChange={handleInputChange}
          placeholder="Your account number"
        />
        {errors.bankAccountNumber && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.bankAccountNumber}</p>}
      </div>

      <Alert tone="info" className="mt-4">
        💡 <strong>Find your details:</strong> Check a check, online banking portal, or call your bank. Routing number is on the left side of your checks.
      </Alert>
    </div>
  );

  // Step 5: Review
  const renderStep5 = () => (
    <div className="ds-wizard-step">
      <h2 className="text-2xl font-bold text-ink-700 mb-2">✓ Review Your Application</h2>
      <p className="text-sm text-ink-500 mb-6">Make sure everything looks correct</p>

      <div className="bg-emerald-tint/40 p-4 rounded-xl mb-4 border-l-4 border-emerald">
        <h3 className="text-sm font-semibold text-ink-700 mb-2">📚 Teaching Info</h3>
        <p className="text-sm text-ink-700 mb-1"><strong>Subjects:</strong> {formData.specialties.join(', ')}</p>
        <p className="text-sm text-ink-700 mb-1"><strong>Grades:</strong> {formData.gradeLevel.join(', ')}</p>
        <p className="text-sm text-ink-700"><strong>Rate:</strong> ${formData.hourlyRate}/hour</p>
      </div>

      <div className="bg-emerald-tint/40 p-4 rounded-xl mb-4 border-l-4 border-emerald">
        <h3 className="text-sm font-semibold text-ink-700 mb-2">🎓 Qualifications</h3>
        <p className="text-sm text-ink-700 mb-1"><strong>Education:</strong> {formData.education}</p>
        <p className="text-sm text-ink-700 mb-1"><strong>Experience:</strong> {formData.experience} years</p>
        {formData.certifications && <p className="text-sm text-ink-700 mb-1"><strong>Certifications:</strong> {formData.certifications}</p>}
        <p className="text-sm text-ink-700"><strong>Credentials:</strong> {formData.credentials ? '✓ Uploaded' : 'Not uploaded'}</p>
      </div>

      <div className="bg-emerald-tint/40 p-4 rounded-xl mb-4 border-l-4 border-emerald">
        <h3 className="text-sm font-semibold text-ink-700 mb-2">🏦 Payout Details</h3>
        <p className="text-sm text-ink-700 mb-1"><strong>Account Holder:</strong> {formData.bankAccountName}</p>
        <p className="text-sm text-ink-700 mb-1"><strong>Account Type:</strong> {formData.accountType}</p>
        <p className="text-sm text-ink-700"><strong>Routing #:</strong> {formData.bankRoutingNumber}</p>
      </div>

      <label className="ds-checkbox-item mt-4">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-line-soft accent-navy-700"
          checked={formData.agreeToTerms}
          onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
        />
        <span className="text-sm text-ink-700">I agree to the Terms of Service and confirm all information is accurate</span>
      </label>
      {errors.agreeToTerms && <p className="mt-1.5 text-xs font-medium text-error-700">{errors.agreeToTerms}</p>}

      {error && <Alert tone="error" className="mt-4">{error}</Alert>}
    </div>
  );

  if (success) {
    return (
      <div className="ds-wizard-shell">
        <div className="flex flex-col items-center gap-4 text-center py-16 px-10">
          <span className="text-[80px] text-success-500">✓</span>
          <h2 className="text-2xl font-bold text-ink-700">Application Submitted!</h2>
          <p className="text-sm text-ink-500">Thank you for applying to become a tutor with Tian Jun Education Group.</p>
          <p className="text-sm text-ink-500">We're reviewing your application and will notify you within 24-48 hours.</p>
          <p className="text-sm text-ink-500">Check your email for updates!</p>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="ds-wizard-shell">
      <div className="ds-wizard-card">
        <ProgressBar value={step} max={5} barClassName="bg-emerald-deep" className="rounded-none" />

        <div className="text-center text-xs font-semibold text-ink-500 py-3 border-b border-line-soft">
          Step {step} of 5
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}

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

          {step < 5 ? (
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
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorOnboarding;
