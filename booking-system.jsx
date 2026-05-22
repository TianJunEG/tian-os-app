import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, DollarSign, Check, ChevronRight, ArrowRight } from 'lucide-react';

export default function BookingSystem({ tutorId = 1, tutorName = 'Sarah Chen', hourlyRate = 45 }) {
  const [step, setStep] = useState(1); // 1: Select Date/Time, 2: Session Details, 3: Payment, 4: Confirmation
  const [bookingData, setBookingData] = useState({
    // Step 1
    date: '',
    startTime: '',
    duration: 60,
    timezone: 'EST',
    // Step 2
    studentName: '',
    subject: '',
    sessionType: 'online',
    location: '',
    description: '',
    // Step 3
    paymentMethod: 'new',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const [tutorAvailability] = useState({
    Monday: [['10:00', '14:00'], ['16:00', '20:00']],
    Tuesday: [['10:00', '14:00'], ['16:00', '20:00']],
    Wednesday: [['10:00', '14:00'], ['16:00', '20:00']],
    Thursday: [['14:00', '20:00']],
    Friday: [['10:00', '14:00'], ['16:00', '20:00']],
    Saturday: [['11:00', '18:00']],
    Sunday: []
  });

  const subjects = ['Math', 'Science', 'English', 'History', 'Languages', 'Computer Science', 'Test Prep'];

  const calculateTotal = () => {
    return Math.round((hourlyRate * bookingData.duration / 60) * 100) / 100;
  };

  const handleConfirmBooking = async () => {
    try {
      // In a real app, send to backend
      console.log('Booking data:', bookingData);
      setStep(4);
    } catch (err) {
      alert('Error booking session: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Book a Session with {tutorName}</h1>
          <p className="text-slate-600">${hourlyRate}/hour</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    s <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {s < step ? <Check size={20} /> : s}
                </div>
                {s < 4 && <div className={`w-12 h-0.5 ${s < step ? 'bg-blue-600' : 'bg-slate-300'}`}></div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-medium text-slate-600">
            <span>Date & Time</span>
            <span>Details</span>
            <span>Payment</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          {/* Step 1: Date & Time Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Select Date & Time</h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Calendar */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-4">Preferred Date</label>
                  <input
                    type="date"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-xs text-slate-500 mt-2">Available dates shown</p>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-4">Start Time</label>
                  <input
                    type="time"
                    value={bookingData.startTime}
                    onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-xs text-slate-500 mt-2">Peak hours may have fewer slots</p>
                </div>
              </div>

              {/* Duration */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-900 mb-4">Duration</label>
                <div className="flex gap-3">
                  {[30, 60, 90, 120].map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setBookingData({ ...bookingData, duration })}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        bookingData.duration === duration
                          ? 'bg-blue-600 text-white border-2 border-blue-600'
                          : 'border-2 border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {duration} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Timezone */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-900 mb-4">Timezone</label>
                <select
                  value={bookingData.timezone}
                  onChange={(e) => setBookingData({ ...bookingData, timezone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="EST">Eastern Time (EST)</option>
                  <option value="CST">Central Time (CST)</option>
                  <option value="MST">Mountain Time (MST)</option>
                  <option value="PST">Pacific Time (PST)</option>
                </select>
              </div>

              {/* Available Slots */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>Available slots:</strong> Multiple times available. Sarah is most responsive between 3-5pm EST.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!bookingData.date || !bookingData.startTime}
                className="w-full mt-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Step 2: Session Details */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Session Details</h2>

              <div className="space-y-6">
                {/* Student Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Student Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={bookingData.studentName}
                    onChange={(e) => setBookingData({ ...bookingData, studentName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Subject</label>
                  <select
                    value={bookingData.subject}
                    onChange={(e) => setBookingData({ ...bookingData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Session Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Session Type</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setBookingData({ ...bookingData, sessionType: 'online' })}
                      className={`flex-1 py-3 rounded-lg font-medium transition border-2 flex items-center justify-center gap-2 ${
                        bookingData.sessionType === 'online'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      💻 Online (Zoom/Meet)
                    </button>
                    <button
                      onClick={() => setBookingData({ ...bookingData, sessionType: 'in-person' })}
                      className={`flex-1 py-3 rounded-lg font-medium transition border-2 flex items-center justify-center gap-2 ${
                        bookingData.sessionType === 'in-person'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      📍 In-Person
                    </button>
                  </div>
                </div>

                {/* Location (if in-person) */}
                {bookingData.sessionType === 'in-person' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Meeting Location</label>
                    <input
                      type="text"
                      placeholder="Address or meeting location"
                      value={bookingData.location}
                      onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    What do you want to focus on? (Optional)
                  </label>
                  <textarea
                    placeholder="E.g., 'Help with AP Calculus exam preparation' or 'First session, want to assess level'"
                    value={bookingData.description}
                    onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:border-slate-400 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!bookingData.studentName || !bookingData.subject}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Payment</h2>

              {/* Price Summary */}
              <div className="bg-slate-50 rounded-lg p-6 mb-8 border border-slate-200">
                <div className="space-y-2 text-sm mb-4 pb-4 border-b border-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Session Rate</span>
                    <span className="font-medium">${hourlyRate}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Duration</span>
                    <span className="font-medium">{bookingData.duration} minutes</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-blue-600">${calculateTotal()}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Payment Method</label>
                <div className="space-y-3">
                  <button
                    onClick={() => setBookingData({ ...bookingData, paymentMethod: 'new' })}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      bookingData.paymentMethod === 'new'
                        ? 'bg-blue-50 border-blue-600'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">Credit Card</p>
                    <p className="text-sm text-slate-600">Add new card</p>
                  </button>
                  <button
                    onClick={() => setBookingData({ ...bookingData, paymentMethod: 'saved' })}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      bookingData.paymentMethod === 'saved'
                        ? 'bg-blue-50 border-blue-600'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">Visa ending in 4242</p>
                    <p className="text-sm text-slate-600">Expires 12/26</p>
                  </button>
                </div>
              </div>

              {/* Card Details (if new) */}
              {bookingData.paymentMethod === 'new' && (
                <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={bookingData.cardNumber}
                      onChange={(e) => setBookingData({ ...bookingData, cardNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={bookingData.expiryDate}
                        onChange={(e) => setBookingData({ ...bookingData, expiryDate: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={bookingData.cvv}
                        onChange={(e) => setBookingData({ ...bookingData, cvv: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Terms */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 mt-1" />
                  <span className="text-sm text-slate-700">
                    I agree to the cancellation policy. Free cancellation up to 24 hours before session.
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:border-slate-400"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmBooking}
                  className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  Complete Booking <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
              <p className="text-slate-600 mb-8">Your session with {tutorName} is booked.</p>

              <div className="bg-slate-50 rounded-lg p-6 text-left mb-8 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Session Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tutor</span>
                    <span className="font-medium">{tutorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date & Time</span>
                    <span className="font-medium">{bookingData.date} at {bookingData.startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Duration</span>
                    <span className="font-medium">{bookingData.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Type</span>
                    <span className="font-medium">{bookingData.sessionType === 'online' ? 'Online' : 'In-Person'}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-3 font-bold">
                    <span>Amount Charged</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 text-sm mb-6">
                A confirmation email has been sent to your email address. Your tutor will send you a meeting link via email and message shortly.
              </p>

              <div className="flex flex-col gap-3">
                <button className="py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                  Go to Dashboard
                </button>
                <button className="py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:border-slate-400 transition">
                  Book Another Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Tutor Info */}
        {step !== 4 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">About Your Tutor</h3>
            <p className="text-slate-600 text-sm">
              Sarah Chen is an MIT graduate with 8 years of tutoring experience. She specializes in AP Calculus and has a 95% student success rate.
            </p>
            <div className="mt-4 flex gap-4">
              <button className="flex-1 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50">
                View Profile
              </button>
              <button className="flex-1 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50">
                Message
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
