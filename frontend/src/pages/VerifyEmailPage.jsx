import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Wordmark } from '../components/tianos';
import { Card, Button, Alert, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../config/nav';

// Reached from the "Confirm Email" link sent by /auth/student-signup. Confirming
// only proves the email works (so a later "forgot password" reaches the
// student) — it never gated access, so nothing here is required to keep using
// the app if the link is lost or expires.
export default function VerifyEmailPage() {
  const { token } = useParams();
  const { verifyEmail } = useAuth();
  const [state, setState] = useState('checking'); // checking | done | error
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await verifyEmail(token);
      if (cancelled) return;
      if (result.success) {
        setUser(result.user);
        setState('done');
      } else {
        setError(result.error);
        setState('error');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const homePath = ROLE_HOME[user?.role] || '/dashboard';

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-raised p-4 font-ui">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center"><Wordmark onDark={false} size={34} /></div>

        {state === 'checking' && (
          <>
            <Spinner label="Confirming your email…" />
          </>
        )}

        {state === 'done' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-deep" />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-emerald-deep">Email confirmed!</h1>
            <p className="mt-3 text-sm text-ink-500">Your account is all set.</p>
            <Button to={homePath} size="m" className="mt-6 w-full">Continue</Button>
          </>
        )}

        {state === 'error' && (
          <>
            <Alert tone="error" icon={AlertCircle} className="mb-4 text-left">{error}</Alert>
            <p className="text-sm text-ink-500">
              This link may have expired, but your account still works — you can log in and keep using it as normal.
            </p>
            <Button to="/login" variant="secondary" size="m" className="mt-6 w-full">Back to sign in</Button>
          </>
        )}
      </Card>
    </div>
  );
}
