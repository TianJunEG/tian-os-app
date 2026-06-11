import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, Badge } from '../ui';
import { interpretConfidence } from '../../mathpath/insights/insightQualityEngine';

function buildCalibrationPatterns(attempts = []) {
  const withConfidence = attempts.filter((a) => a.confidence || a.confidenceLevel);
  if (!withConfidence.length) return [];
  const counts = {};
  withConfidence.forEach((a) => {
    const { pattern } = interpretConfidence({
      correct: a.correct ?? a.answerCorrect,
      confidence: a.confidence || a.confidenceLevel,
    });
    counts[pattern] = (counts[pattern] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count);
}

function patternTone(pattern) {
  if (pattern === 'high_confidence_wrong') return 'error';
  if (pattern === 'low_confidence_correct') return 'gold';
  if (pattern === 'confident_correct') return 'success';
  return 'neutral';
}

export default function ConfidenceCalibrationCard({
  confidenceSignals = {},
  attempts = [],
  audience = 'parent',
}) {
  const { mismatchCount = 0, trend = 'stable' } = confidenceSignals;
  const patterns = useMemo(() => buildCalibrationPatterns(attempts), [attempts]);
  const actionablePatterns = patterns.filter((p) => p.pattern !== 'confident_correct' && p.pattern !== 'confidence_building');

  if (mismatchCount < 2 && !actionablePatterns.length) return null;

  const severity = mismatchCount >= 5 ? 'high' : 'medium';
  const severityTone = severity === 'high' ? 'error' : 'gold';
  const TrendIcon = trend === 'watch' ? TrendingDown : TrendingUp;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-gold-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Confidence Calibration</p>
            <p className="mt-1 text-lg font-semibold text-navy-700">
              {mismatchCount} mismatch{mismatchCount === 1 ? '' : 'es'} detected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={severityTone}>{severity}</Badge>
          <div className="flex items-center gap-1 text-xs text-ink-500" title={`Trend: ${trend}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{trend === 'watch' ? 'Watch' : 'Stable'}</span>
          </div>
        </div>
      </div>

      {actionablePatterns.length > 0 && (
        <div className="mt-4 space-y-2">
          {actionablePatterns.slice(0, 3).map(({ pattern, count }) => {
            const insight = interpretConfidence({
              correct: pattern.includes('correct'),
              confidence: pattern.includes('high_confidence') || pattern === 'confident_correct' ? 'i_know_this' : 'dont_know',
            });
            const text = audience === 'tutor' ? insight.tutor : insight.parent;
            return (
              <div key={pattern} className="rounded-lg border border-hairline p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-700">
                    {pattern.replace(/_/g, ' ').replace(/^./, (s) => s.toUpperCase())}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge tone={patternTone(pattern)}>{count}×</Badge>
                  </div>
                </div>
                <p className="mt-1 text-sm text-ink-600">{text}</p>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-xs text-ink-500">
        {audience === 'tutor'
          ? 'Use these signals to decide whether reteaching or confidence-building is the priority.'
          : 'These patterns help you understand whether your child needs more practice or more encouragement.'}
      </p>
    </Card>
  );
}
