import React from 'react';
import { AlertTriangle, FileCheck2, Upload } from 'lucide-react';
import { Badge, Card } from '../../ui';

function toneForEscalation(escalation = '') {
  if (escalation === 'priority_remediation' || escalation === 'diagnostic_assessment') return 'error';
  if (escalation === 'tutor_intervention' || escalation === 'parent_notify') return 'gold';
  return 'neutral';
}

function escalationLabel(escalation = '') {
  return String(escalation || 'monitor')
    .replace(/_/g, ' ')
    .replace(/^./, (s) => s.toUpperCase());
}

export default function AdultWorkingReviewPanel({ review = {}, title = 'Working Review' }) {
  const summary = review.summary || {};
  const sessions = Array.isArray(review.workingSessions) ? review.workingSessions : [];
  const insights = Array.isArray(review.workingInsights) ? review.workingInsights : [];
  const helpRequests = Array.isArray(review.helpRequests) ? review.helpRequests : [];
  const recentSessions = sessions.slice(0, 3);
  const recentInsights = insights.slice(0, 3);
  const topHelp = helpRequests.slice(0, 3);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
          <p className="mt-1 text-sm text-ink-600">Workings, help requests, and review status from recent MathPath sessions.</p>
        </div>
        <Badge tone={Number(summary.needsReviewCount || 0) > 0 ? 'gold' : 'neutral'}>
          {summary.needsReviewCount || 0} need review
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-ink-500">Pending upload</p>
          <p className="font-mono text-xl text-navy-700">{summary.pendingUploadCount || 0}</p>
        </div>
        <div>
          <p className="text-xs text-ink-500">Pending analysis</p>
          <p className="font-mono text-xl text-navy-700">{summary.pendingAnalysisCount || 0}</p>
        </div>
        <div>
          <p className="text-xs text-ink-500">Needs review</p>
          <p className="font-mono text-xl text-navy-700">{summary.needsReviewCount || 0}</p>
        </div>
        <div>
          <p className="text-xs text-ink-500">Analysed</p>
          <p className="font-mono text-xl text-navy-700">{summary.analysedCount || 0}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-hairline p-3">
          <div className="mb-2 flex items-center gap-2">
            <Upload className="h-4 w-4 text-ink-500" />
            <p className="text-sm font-semibold text-ink-700">Recent working submissions</p>
          </div>
          {recentSessions.length ? (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div key={session.workingSessionId} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-ink-600">
                  <p className="font-mono text-xs text-ink-500">{session.workingSessionId}</p>
                  <p>{session.domainId || 'MathPath'} · {(session.skillIds || []).join(', ') || 'Unmapped skill'}</p>
                  <p>Status: {session.status} · Analysis: {session.analysisStatus}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500">No working submissions yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-hairline p-3">
          <div className="mb-2 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-ink-500" />
            <p className="text-sm font-semibold text-ink-700">Working insights</p>
          </div>
          {recentInsights.length ? (
            <div className="space-y-2">
              {recentInsights.map((record) => {
                const insight = record.workingInsight || {};
                return (
                  <div key={record.workingId} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-ink-600">
                    <p className="font-semibold text-ink-700">{record.skillId || record.questionId || 'Submitted working'}</p>
                    <p>Method: {insight.detectedMethod || 'Analysis is still being prepared'}</p>
                    <p>Issue: {insight.detectedIssue || insight.studentExplanation || 'Working saved. Insight pending.'}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ink-500">Working insights will appear after analysis.</p>
          )}
        </div>

        <div className="rounded-lg border border-hairline p-3">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-ink-500" />
            <p className="text-sm font-semibold text-ink-700">Student help requests</p>
          </div>
          {topHelp.length ? (
            <div className="space-y-2">
              {topHelp.map((row) => (
                <div key={row.skillId} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-ink-600">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink-700">{row.skillId}</p>
                    <Badge tone={toneForEscalation(row.escalation)}>{escalationLabel(row.escalation)}</Badge>
                  </div>
                  <p>Requests: {row.count} · Wrong: {row.wrongCount} · Correct: {row.correctCount}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <FileCheck2 className="h-4 w-4" />
              <p>No repeated help requests yet.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
