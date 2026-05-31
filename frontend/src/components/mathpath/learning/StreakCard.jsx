import React from 'react';
import { Flame } from 'lucide-react';
import { Card } from '../../ui';

export default function StreakCard({ streakDays = 1, message }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700">
          <Flame className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-800">{streakDays}-day learning streak</p>
          <p className="mt-1 text-sm text-ink-600">{message || 'Great consistency. Keep going tomorrow.'}</p>
        </div>
      </div>
    </Card>
  );
}
