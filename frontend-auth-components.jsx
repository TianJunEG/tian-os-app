import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, ArrowRight, Check, AlertCircle } from 'lucide-react';

// ============================================
// PARENT LOGIN / SIGNUP
// ============================================
export function ParentAuthFlow() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    state: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/parent-signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Authentication failed');
        return;
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => window.location.href = '/parent/dashboard', 1500);
      } else {
        setSuccess('Account created! Check your email to verify.');
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AEO</h1>
          <p className="text-slate-600">
            {isLogin ? 'Welcome back!' : 'Start your learning journey'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 font-semibold transition rounded-lg ${
                isLogin
                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                  : 'bg-slate-100 text-slate-600 border-2 border-transparent'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 font-semibold transition rounded-lg ${
                !isLogin
                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                  : 'bg-slate-100 text-slate-600 border-2 border-transparent'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                <Check size={20} className="text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Signup Fields */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                    <input
                      type="text"
                      placeholder="San Francisco"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                    <input
                      type="text"
                      placeholder="CA"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-3 text-slate-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-slate-500 mt-2">Min. 8 characters, uppercase, lowercase, number</p>
              )}
            </div>

            {/* Remember Me / Forgot Password */}
            {isLogin && (
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                  <span className="text-slate-600">Remember me</span>
                </label>
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  Forgot password?
                </a>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <button
              type="button"
              className="w-full py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Continue with Google
            </button>

            {/* Toggle */}
            <p className="text-center text-sm text-slate-600">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 font-semibold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-6">
          By signing up, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

// ============================================
// TUTOR LOGIN / SIGNUP
// ============================================
export function TutorAuthFlow() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: Basic, 2: Qualifications, 3: Banking
  const [formData, setFormData] = useState({
    // Basic
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    state: '',
    // Qualifications
    subjects: [],
    yearsOfExperience: '',
    hourlyRate: '',
    bio: '',
    education: [],
    // Banking
    bankAccountHolder: '',
    bankRoutingNumber: '',
    bankAccountNumber: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && step < 3) {
      setStep(step + 1);
      return;
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/tutor-signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/tutor/dashboard';
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AEO For Tutors</h1>
          <p className="text-slate-600">
            {isLogin ? 'Manage your tutoring business' : 'Start earning as a tutor'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          {!isLogin && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                        s <= step
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`w-12 h-0.5 transition ${
                          s < step ? 'bg-green-600' : 'bg-slate-200'
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-600 text-center">
                {step === 1 && 'Basic Information'}
                {step === 2 && 'Teaching Qualifications'}
                {step === 3 && 'Payment Setup'}
              </p>
            </div>
          )}

          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 font-semibold rounded-lg transition ${
                isLogin
                  ? 'bg-green-100 text-green-600 border-2 border-green-600'
                  : 'bg-slate-100 text-slate-600 border-2 border-transparent'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setStep(1);
              }}
              className={`flex-1 py-2 font-semibold rounded-lg transition ${
                !isLogin
                  ? 'bg-green-100 text-green-600 border-2 border-green-600'
                  : 'bg-slate-100 text-slate-600 border-2 border-transparent'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Basic Info */}
            {(isLogin || step === 1) && (
              <>
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  required
                />
              </>
            )}

            {/* Step 2: Qualifications */}
            {!isLogin && step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subjects You Teach</label>
                  <select
                    multiple
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600"
                  >
                    <option>Math</option>
                    <option>Science</option>
                    <option>English</option>
                    <option>History</option>
                    <option>Languages</option>
                  </select>
                </div>
                <input
                  type="number"
                  placeholder="Years of Experience"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600"
                />
                <input
                  type="number"
                  placeholder="Hourly Rate ($)"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600"
                />
                <textarea
                  placeholder="Tell us about your teaching style and experience"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </>
            )}

            {/* Step 3: Banking */}
            {!isLogin && step === 3 && (
              <>
                <p className="text-sm text-slate-600 mb-4">Add your bank details for payouts</p>
                <input
                  type="text"
                  placeholder="Account Holder Name"
                  value={formData.bankAccountHolder}
                  onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600"
                />
                <input
                  type="text"
                  placeholder="Routing Number"
                  value={formData.bankRoutingNumber}
                  onChange={(e) => setFormData({ ...formData, bankRoutingNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600"
                />
                <input
                  type="password"
                  placeholder="Account Number"
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition"
            >
              {isLogin ? 'Sign In' : step < 3 ? 'Next Step' : 'Create Account'}
            </button>

            {!isLogin && step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="w-full py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
              >
                Back
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADMIN LOGIN
// ============================================
export function AdminAuthFlow() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/admin/dashboard';
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AEO Admin</h1>
          <p className="text-purple-200">Manage the platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Admin Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition"
            >
              Admin Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ParentAuthFlow;
