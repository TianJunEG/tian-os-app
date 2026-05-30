import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { Card, Button, PageHeader, Badge } from '../../../../components/ui';
import { mathpathAPI } from '../../../../services/api';

function inferLevel(user) {
  return user?.studentLevel || user?.moeLevel || user?.profile?.studentLevel || 'P4';
}

function modeForLevel(level) {
  const l = String(level || '').toUpperCase();
  if (l === 'P3') return 'basic';
  if (l === 'P4') return 'core';
  if (l === 'P1' || l === 'P2') return 'basic';
  return 'full';
}

export default function DiagnosticIntroScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const inferred = inferLevel(user);
  const [studentLevel, setStudentLevel] = useState(inferred);
  const [mode, setMode] = useState(modeForLevel(inferred));
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const enrichment = ['P1', 'P2'].includes(String(studentLevel || '').toUpperCase());
  const estimate = useMemo(() => {
    return {
      questions: mode === 'basic' ? 12 : mode === 'core' ? 18 : 24,
      durationMin: mode === 'basic' ? 8 : mode === 'core' ? 12 : 20,
    };
  }, [mode]);

  const startDiagnostic = async () => {
    if (starting) return;
    setStarting(true);
    setError('');
    try {
      const { data } = await mathpathAPI.startDiagnostic({
        requestedMode: mode,
        studentLevel,
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
      setError(e?.response?.data?.error || e.message || "Couldn't start diagnostic.");
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Fractions Diagnostic" subtitle="Find your best starting point in MathPath." />
      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-sm text-ink-700">
            This diagnostic helps MathPath find your best starting point for Fractions. It is not a school test.
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
                className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm"
              >
                {['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'Sec1', 'Sec2', 'Sec3', 'Sec4'].map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label className="text-sm text-ink-600">
              Diagnostic Mode
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm">
                <option value="basic">basic</option>
                <option value="core">core</option>
                <option value="full">full</option>
              </select>
            </label>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-ink-600">
              <p className="text-xs uppercase tracking-[0.08em] text-ink-500">Estimate</p>
              <p>{estimate.questions} questions</p>
              <p>{estimate.durationMin} min</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="navy">Calculator: not allowed</Badge>
            <Badge tone="neutral">One question at a time</Badge>
          </div>
        </Card>

        {enrichment && (
          <Card className="border-l-4 border-l-gold-500 p-4">
            <div className="flex items-start gap-2 text-sm text-gold-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Fractions are usually introduced later. This may be used for enrichment or early exposure.</p>
            </div>
          </Card>
        )}

        {error && <Card className="p-3 text-sm text-error-700">{error}</Card>}
        <Button size="l" icon={ArrowRight} className="w-full" onClick={startDiagnostic} disabled={starting}>
          {starting ? 'Starting…' : 'Start Diagnostic'}
        </Button>
      </div>
    </div>
  );
}
