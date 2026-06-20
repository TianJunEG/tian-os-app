import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { Card, Button, PageHeader, Badge } from '../../../../components/ui';
import { mathpathAPI } from '../../../../services/api';

function inferLevel(user) {
  return user?.studentLevel || user?.moeLevel || user?.profile?.studentLevel || 'P4';
}

function modeForLevel(level) {
  const l = String(level || '').toUpperCase().replace(/\s+/g, '');
  if (l === 'K2' || l === 'K1') return 'basic';
  if (l === 'P1' || l === 'P2' || l === 'P3') return 'basic';
  if (l === 'P4') return 'core';
  return 'full';
}

const MODE_LABELS = {
  basic: 'Quick Check-In',
  core: 'Core Diagnostic',
  full: 'Full Diagnostic',
};

const PURPOSE_LABELS = {
  baseline: 'Baseline Check',
  recheck: 'Recheck',
  assigned: 'Assigned Diagnostic',
};

export default function DiagnosticIntroScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const inferred = inferLevel(user);
  // Which diagnostic domain to run, from the registry-driven dashboard link
  // (?domain=...) or explicit nav state; defaults to fractions.
  const domainId = new URLSearchParams(location.search).get('domain') || location.state?.domainId || 'fractions';
  const diagnosticPurpose = location.state?.diagnosticPurpose || 'baseline';
  const allowModeOverride = Boolean(location.state?.allowModeOverride);
  const [studentLevel, setStudentLevel] = useState(inferred);
  const [mode, setMode] = useState(modeForLevel(inferred));
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const enrichment = ['P1', 'P2'].includes(String(studentLevel || '').toUpperCase());
  const estimate = useMemo(() => {
    if (diagnosticPurpose === 'baseline') {
      return {
        questions: mode === 'full' ? 12 : 10,
        durationMin: mode === 'full' ? 10 : 8,
      };
    }
    return {
      questions: mode === 'basic' ? 12 : mode === 'core' ? 18 : 24,
      durationMin: mode === 'basic' ? 8 : mode === 'core' ? 12 : 20,
    };
  }, [mode, diagnosticPurpose]);

  const startDiagnostic = async () => {
    if (starting) return;
    setStarting(true);
    setError('');
    try {
      const { data } = await mathpathAPI.startDiagnostic({
        domainId,
        requestedMode: mode,
        studentLevel,
        diagnosticPurpose,
      });
      const session = data?.session;
      const questions = data?.questions || [];
      if (!questions.length) {
        setError("Couldn't generate diagnostic questions yet. Please try again.");
        setStarting(false);
        return;
      }
      navigate(`/student/mathpath/diagnostic/session/${session.sessionId || data?.sessionId}`, {
        state: { session, questions, studentLevel, mode },
      });
    } catch (e) {
      // Product decision: interrupted/exited check-ins RESET — they are never
      // resumed. The backend abandons any in-progress session on start and creates
      // a fresh one, so we no longer resume on REPLAY_BLOCKED here.
      setError(e?.response?.data?.error || e.message || "Couldn't start diagnostic.");
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={diagnosticPurpose === 'baseline' ? 'Fractions Check-In' : 'Fractions Diagnostic'}
        subtitle="Find your best starting point in MathPath."
      />
      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-sm text-ink-700">
            This check-in helps MathPath find your best starting point for Fractions. It is not a school test.
            Try your best so we can recommend the right practice.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-ink-600">
              Student Level
              <select
                value={studentLevel}
                onChange={(e) => {
                  const nextLevel = e.target.value;
                  setStudentLevel(nextLevel);
                  setMode(modeForLevel(nextLevel));
                }}
                className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
              >
                {['K2', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'Secondary G1'].map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            {allowModeOverride ? (
              <label className="text-sm text-ink-600">
                Diagnostic Mode
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm">
                  <option value="basic">{MODE_LABELS.basic}</option>
                  <option value="core">{MODE_LABELS.core}</option>
                  <option value="full">{MODE_LABELS.full}</option>
                </select>
              </label>
            ) : (
              <div className="text-sm text-ink-600">
                Diagnostic Mode
                <div className="mt-1 rounded-lg border border-line-soft bg-surface-raised px-3 py-2 text-sm">{MODE_LABELS[mode] || mode}</div>
              </div>
            )}
            <div className="rounded-lg bg-surface-raised px-3 py-2 text-sm text-ink-600">
              <p className="text-xs uppercase tracking-[0.08em] text-ink-500">Estimate</p>
              <p>{estimate.questions} questions</p>
              <p>{estimate.durationMin} min</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            {PURPOSE_LABELS[diagnosticPurpose] || 'Diagnostic'} · {MODE_LABELS[mode] || mode}. Question count is fixed for this mode.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="navy">Calculator: not allowed</Badge>
            <Badge tone="neutral">One question at a time</Badge>
          </div>
        </Card>

        {enrichment && (
          <Card className="border-l-4 border-l-gold p-4">
            <div className="flex items-start gap-2 text-sm text-gold-deep">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Fractions are usually introduced later. This may be used for enrichment or early exposure.</p>
            </div>
          </Card>
        )}

        {error && <Card className="p-3 text-sm text-error-700">{error}</Card>}
        <Button size="l" icon={ArrowRight} className="w-full" onClick={startDiagnostic} disabled={starting}>
          {starting ? 'Starting…' : diagnosticPurpose === 'baseline' ? 'Start Fractions Check-In' : 'Start Diagnostic'}
        </Button>
      </div>
    </div>
  );
}
