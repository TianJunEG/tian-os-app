import * as Sentry from '@sentry/node';

let initialized = false;

export function initErrorMonitoring({ dsn, environment, release } = {}) {
  const sentryDsn = dsn || process.env.SENTRY_DSN;
  if (!sentryDsn || initialized) return;

  Sentry.init({
    dsn: sentryDsn,
    environment: environment || process.env.NODE_ENV || 'development',
    release: release || process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    beforeSend(event) {
      if (process.env.NODE_ENV === 'test') return null;
      return event;
    },
  });
  initialized = true;
}

export function captureException(err, context = {}) {
  if (!initialized) {
    console.error('[error-monitoring] uninitialized, logging to console:', err?.message || err);
    return;
  }
  Sentry.withScope((scope) => {
    if (context.user) scope.setUser(context.user);
    if (context.tags) Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
    if (context.extra) Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(err);
  });
}

export function captureMessage(message, level = 'info', context = {}) {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context.tags) Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
    Sentry.captureMessage(message, level);
  });
}

export function sentryRequestHandler() {
  if (!initialized) return (req, res, next) => next();
  return Sentry.Handlers.requestHandler();
}

export function sentryErrorHandler() {
  if (!initialized) return (err, req, res, next) => next(err);
  return Sentry.Handlers.errorHandler();
}

export function setUser(user) {
  if (!initialized || !user) return;
  Sentry.setUser({
    id: String(user._id || user.id || ''),
    email: user.email || '',
    username: user.name || '',
  });
}

export function clearUser() {
  if (!initialized) return;
  Sentry.setUser(null);
}
