import React from 'react';
import { Link } from 'react-router-dom';

// Tian OS shared UI primitives. Calm navy/gold, hairline borders, rounded cards,
// JetBrains Mono numerics. Built on the Tailwind tokens added in tailwind.config.js
// + index.css. Reuse these everywhere — do not hand-roll card/badge markup.

// ─── Card ───────────────────────────────────────────────────────────
export function Card({ children, className = '', interactive = false, ...rest }) {
  return (
    <div
      className={`rounded-2xl border border-hairline bg-paper shadow-resting ${interactive ? 'transition hover:shadow-active' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

// ─── Button ─────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: 'bg-navy-700 text-white hover:bg-navy-800',
  secondary: 'bg-paper text-navy-700 border border-hairline hover:bg-navy-050',
  ghost: 'bg-transparent text-navy-700 hover:bg-navy-050',
  gold: 'bg-gold-400 text-navy-900 hover:bg-gold-500',
};
const BTN_SIZES = { s: 'h-9 px-3.5 text-[13px]', m: 'h-12 px-5 text-[15px]', l: 'h-14 px-6 text-base' };

export function Button({ children, variant = 'primary', size = 'm', as, to, className = '', icon: Icon, ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold tracking-[-0.01em] transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`;
  const content = (<>{Icon && <Icon className="h-[18px] w-[18px]" />}{children}</>);
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  const Tag = as || 'button';
  return <Tag className={cls} {...rest}>{content}</Tag>;
}

// ─── Badge / StatusBadge ────────────────────────────────────────────
const BADGE_TONES = {
  neutral: 'bg-bone text-ink-700', navy: 'bg-navy-050 text-navy-700',
  gold: 'bg-gold-100 text-gold-700', success: 'bg-success-100 text-success-700',
  error: 'bg-error-100 text-error-700', outline: 'bg-paper text-ink-700 border border-hairline',
};
export function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]} ${className}`}>{children}</span>;
}

// Maps domain statuses to a fixed tone + label so badges stay consistent.
const STATUS_MAP = {
  mastered: ['success', 'Mastered'], learning: ['navy', 'Learning'],
  needs_review: ['error', 'Needs review'], needs_support: ['error', 'Needs support'],
  not_started: ['neutral', 'Not started'], in_progress: ['navy', 'In progress'],
  completed: ['success', 'Completed'], overdue: ['error', 'Overdue'],
  prepared: ['success', 'Prepared'], improving: ['success', 'Improving'], stable: ['navy', 'Stable'],
};
export function StatusBadge({ status }) {
  const [tone, label] = STATUS_MAP[status] || ['neutral', String(status || '').replace(/_/g, ' ')];
  return <Badge tone={tone}>{label}</Badge>;
}

// ─── ProgressBar ────────────────────────────────────────────────────
export function ProgressBar({ value = 0, max = 100, className = '' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-bone ${className}`}>
      <div className="h-full rounded-full bg-navy-700 transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── StatTile — small KPI ───────────────────────────────────────────
export function StatTile({ label, value, suffix }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</div>
      <div className="font-mono text-2xl font-semibold leading-none tracking-[-0.02em] text-navy-700 tabular-nums">
        {value}{suffix && <span className="ml-0.5 text-[13px] font-medium text-ink-500">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── PageHeader ─────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-700">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, message, children }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {Icon && <span className="grid h-12 w-12 place-items-center rounded-2xl bg-bone text-ink-500"><Icon className="h-6 w-6" /></span>}
      <p className="max-w-sm text-sm text-ink-500">{message}</p>
      {children}
    </Card>
  );
}

// ─── Spinner ────────────────────────────────────────────────────────
export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-bone border-t-navy-700" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

// ─── ModuleCard — one module on the dashboard grid ──────────────────
export function ModuleCard({ module, footer }) {
  const { name, purpose, icon: Icon, path, status } = module;
  const soon = status === 'soon';
  const inner = (
    <Card interactive={!soon} className={`flex h-full flex-col p-5 ${soon ? 'opacity-70' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-050 text-navy-700"><Icon className="h-5 w-5" /></span>
        {soon && <Badge tone="neutral">Coming soon</Badge>}
      </div>
      <h3 className="font-semibold text-ink-700">{name}</h3>
      <p className="mt-1 flex-1 text-sm text-ink-500">{purpose}</p>
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
  if (soon) return <div aria-disabled className="cursor-default">{inner}</div>;
  return <Link to={path} className="block focus-visible:outline-none">{inner}</Link>;
}
