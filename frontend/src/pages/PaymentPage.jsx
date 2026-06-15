import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { bookingsAPI, paymentsAPI } from '../services/api';
import { stripePromise, stripeConfigured } from '../services/stripe';
import { AlertCircle, CheckCircle } from 'lucide-react';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'ui-monospace, monospace',
      '::placeholder': { color: '#9ca3af' }
    },
    invalid: { color: '#dc2626' }
  }
};

function CheckoutForm({ bookingId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return; // Stripe.js not loaded yet

    setError('');
    setLoading(true);

    try {
      // 1. Create the payment intent on the server.
      const intentResponse = await paymentsAPI.createPaymentIntent({ bookingId });
      const clientSecret = intentResponse.data.clientSecret;

      // 2. Confirm the card payment client-side with Stripe.js.
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name }
        }
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed. Please check your card details.');
        return;
      }

      if (result.paymentIntent?.status !== 'succeeded') {
        setError('Payment was not completed. Please try again.');
        return;
      }

      // 3. Tell the server to finalize the booking against the succeeded intent.
      const confirmResponse = await paymentsAPI.confirmPayment({
        paymentIntentId: result.paymentIntent.id,
        bookingId
      });

      if (confirmResponse.data.success) {
        onSuccess();
      } else {
        setError('Payment succeeded but the booking could not be confirmed. Please contact support.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-emerald">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="text-xs text-gray-500 mt-1">Test card: 4242 4242 4242 4242, any future expiry, any CVC.</p>
      </div>

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-gradient-to-r from-navy-600 to-blue-600 text-white font-medium py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay $${amount}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        By completing this payment, you agree to our Terms of Service
      </p>
    </form>
  );
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const response = await bookingsAPI.getBooking(bookingId);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Failed to load booking:', error);
      setLoadError('Booking not found');
    }
  };

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => navigate('/bookings'), 2000);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{loadError}</p>
        </div>
      </div>
    );
  }

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
          <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gold-600">Checkout</div>
          <h1 className="text-3xl font-serif font-medium text-emerald-deep leading-tight">Payment</h1>
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
                <span className="text-2xl font-bold text-emerald">${booking.totalCost}</span>
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

              {stripeConfigured ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    bookingId={bookingId}
                    amount={booking.totalCost}
                    onSuccess={handleSuccess}
                  />
                </Elements>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-sm">
                    Payments are not configured. Set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in the
                    frontend environment to enable checkout.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
