import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Only initialize Stripe when a publishable key is configured. When it isn't,
// the payment page renders a clear "not configured" notice instead of breaking.
export const stripeConfigured = Boolean(publishableKey);
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
