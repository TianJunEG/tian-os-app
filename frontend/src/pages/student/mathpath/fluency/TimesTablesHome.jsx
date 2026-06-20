import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Trophy, BarChart3 } from 'lucide-react';
import { Button, Card, PageHeader, ProgressBar } from '../../../../components/ui';
import { useAuth } from '../../../../context/AuthContext';
import {
  TABLES,
  STRENGTH,
  allFactPairs,
  initialFactState,
  factKey,
} from '../../../../mathpath/timesTablesEngine';

const storageKey = (userId) => `tian_times_tables_facts_${userId}`;

function loadFactState(userId) {
  if (!userId) return initialFactState();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : initialFactState();
  } catch {
    return initialFactState();
  }
}

function TableStrengthBar({ table, factState }) {
  const pairs = TABLES.filter((b) => b >= table).map((b) => [table, b]);
  const total = pairs.length;
  const secure = pairs.filter(([a, b]) => factState[factKey(a, b)]?.strength === STRENGTH.SECURE).length;
  const developing = pairs.filter(([a, b]) => factState[factKey(a, b)]?.strength === STRENGTH.DEVELOPING).length;
  const pct = total ? Math.round(((secure + developing * 0.5) / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-right text-sm font-bold text-emerald-deep">{table}×</span>
      <div className="flex-1">
        <ProgressBar value={pct} max={100} size="sm" />
      </div>
      <span className="w-12 text-right text-xs text-ink-500">{secure}/{total}</span>
    </div>
  );
}

export default function TimesTablesHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || user?._id || user?.email || '';
  const [factState, setFactState] = useState(() => initialFactState());

  useEffect(() => {
    if (!userId) return;
    setFactState(loadFactState(userId));
  }, [userId]);

  const allPairs = allFactPairs();
  const secureCount = allPairs.filter(([a, b]) => factState[factKey(a, b)]?.strength === STRENGTH.SECURE).length;
  const totalFacts = allPairs.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Times Tables"
        subtitle="Build speed and accuracy with your times tables"
        back="/student/mathpath/fluency"
      />

      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Your Progress</h2>
              <p className="text-sm text-teal-100">{secureCount} of {totalFacts} facts secure</p>
            </div>
          </div>
          <ProgressBar value={secureCount} max={totalFacts} size="lg" className="mt-2" />
        </div>
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          size="l"
          className="bg-coral-500 hover:bg-coral-600 text-white"
          onClick={() => navigate('/student/mathpath/fluency/times-tables/flash-quiz')}
        >
          <Zap className="mr-2 h-5 w-5" />
          Flash Quiz
        </Button>
        <Button
          size="l"
          variant="secondary"
          onClick={() => navigate('/student/mathpath/fluency/times-tables/flash-quiz', { state: { mode: 'practice' } })}
        >
          <BarChart3 className="mr-2 h-5 w-5" />
          Practice Mode
        </Button>
      </div>

      {/* Per-table strength bars */}
      <Card className="p-5">
        <h3 className="mb-4 text-base font-bold text-emerald-deep">Table-by-Table Strength</h3>
        <div className="space-y-3">
          {TABLES.map((table) => (
            <TableStrengthBar key={table} table={table} factState={factState} />
          ))}
        </div>
      </Card>

      {/* Educational card */}
      <Card className="border border-sky-200 bg-sky-50 p-5">
        <h3 className="text-base font-bold text-emerald-deep">Why times tables help fractions</h3>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          Quick times-table recall makes finding common denominators, simplifying fractions, and
          multiplying fractions much easier. When you don't have to think hard about basic
          multiplication, you can focus on understanding the fraction concepts.
        </p>
      </Card>
    </div>
  );
}
