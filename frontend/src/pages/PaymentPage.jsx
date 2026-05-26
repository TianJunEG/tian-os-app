import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI, paymentsAPI } from '../services/api';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const response = await bookingsAPI.getBooking(bookingId);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Failed to load booking:', error);
      setError('Booking not found');
    }
  };

  const handleCardChange = (e) => {
    let { name, value } = e.target;

    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').slice(0, 16);
      value = value.replace(/\d{4}(?=\d)/g, '$& ');
    } else if (name === 'expiry') {
      value = value.slice(0, 5);
      if (value.length === 2 && !value.includes('/')) {
        value += '/';
      }
    } else if (name === 'cvc') {
      value = value.slice(0, 4);
    }

    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In a real app, you would use @stripe/react-stripe-js
      // For now, we'll simulate a payment intent

      // Step 1: Create payment intent
      const intentResponse = await paymentsAPI.createPaymentIntent({
        bookingId
      });

      // Step 2: In production, use Stripe.js to confirm the payment
      // For demo, we'll just confirm it with the backend

      const confirmResponse = await paymentsAPI.confirmPayment({
        paymentIntentId: intentResponse.data.clientSecret.split('_secret_')[0] + '_secret_' + intentResponse.data.clientSecret.split('_secret_')[1],
        bookingId
      });

      if (confirmResponse.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/bookings');
        }, 2000);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your booking with {booking.tutorId?.name} is confirmed.
          </p>
          <p className="text-sm text-gray-500">Redirecting to bookings...</p>
        </div>
      </div>
    );
  }

  const platformFee = booking.totalCost * 0.1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b">
                <div>
                  <p className="text-sm text-gray-600">Tutor</p>
                  <p className="font-semibold text-gray-900">{booking.tutorId?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="font-semibold text-gray-900">{booking.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.startTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{booking.duration} hour(s)</p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session Cost</span>
                  <span className="font-semibold">${booking.totalCost}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee (10%)</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Amount Due</span>
                <span className="text-2xl font-bold text-navy-600">${booking.totalCost}</span>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                🔒 Your payment is secure and processed through Stripe. Your card details are never stored on our servers.
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Method</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={cardDetails.name}
                    onChange={handleCardChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardChange}
                    placeholder="4242 4242 4242 4242"
                    maxLength="19"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Test: 4242 4242 4242 4242</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiry"
                      value={cardDetails.expiry}
                      onChange={handleCardChange}
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      name="cvc"
                      value={cardDetails.cvc}
                      onChange={handleCardChange}
                      placeholder="123"
                      maxLength="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6">
                  <p>
                    <strong>Demo Mode:</strong> Use test card 4242 4242 4242 4242 with any future expiry and any 3-digit CVC.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-navy-600 to-blue-600 text-white font-medium py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay $${booking.totalCost}`}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By completing this payment, you agree to our Terms of Service
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
