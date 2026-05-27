import React from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

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
  secondary: 'bg-paper text-navy-700 border border-hairline hover:bg-navy-50',
  ghost: 'bg-transparent text-navy-700 hover:bg-navy-50',
  gold: 'bg-gold-400 text-navy-900 hover:bg-gold-500',
  // For use on dark/navy surfaces (e.g. hero cards).
  outlineLight: 'bg-transparent text-white border border-white/40 hover:bg-white/10',
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
  neutral: 'bg-bone text-ink-700', navy: 'bg-navy-50 text-navy-700',
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
  // mastery v2 vocabulary (derived 5-state ladder)
  developing: ['gold', 'Developing'], practising: ['navy', 'Practising'], fluent: ['success', 'Fluent'],
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
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-navy-700"><Icon className="h-5 w-5" /></span>
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

// ─── Form controls ──────────────────────────────────────────────────
// One shared input style so every form matches: rounded, hairline border, gold
// focus ring, ink text. Use <Field> to add a label/hint/error around any control.
// text-base (16px) on mobile prevents iOS auto-zoom on focus; tighten to 14px ≥sm.
const CONTROL_BASE =
  'w-full rounded-xl bg-paper text-base sm:text-sm text-ink-700 placeholder:text-ink-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 disabled:cursor-not-allowed disabled:opacity-50';
const controlBorder = (invalid) =>
  invalid ? 'border border-error-500 focus-visible:border-error-500' : 'border border-hairline focus-visible:border-navy-400';

export const Input = React.forwardRef(function Input({ icon: Icon, invalid, className = '', ...props }, ref) {
  const base = `${CONTROL_BASE} ${controlBorder(invalid)} h-11`;
  if (Icon) {
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-300" aria-hidden />
        <input ref={ref} aria-invalid={invalid || undefined} className={`${base} pl-10 pr-3.5 ${className}`} {...props} />
      </div>
    );
  }
  return <input ref={ref} aria-invalid={invalid || undefined} className={`${base} px-3.5 ${className}`} {...props} />;
});

export const Textarea = React.forwardRef(function Textarea({ invalid, className = '', rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} aria-invalid={invalid || undefined}
    className={`${CONTROL_BASE} ${controlBorder(invalid)} resize-y px-3.5 py-2.5 ${className}`} {...props} />;
});

export const Select = React.forwardRef(function Select({ invalid, className = '', children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} aria-invalid={invalid || undefined}
        className={`${CONTROL_BASE} ${controlBorder(invalid)} h-11 appearance-none pl-3.5 pr-10 ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" aria-hidden />
    </div>
  );
});

export function Checkbox({ label, className = '', type = 'checkbox', ...props }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 ${className}`}>
      <input type={type}
        className="h-4 w-4 rounded border-hairline text-navy-700 accent-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40"
        {...props} />
      {label && <span>{label}</span>}
    </label>
  );
}

// Radio is a checkbox with type=radio (same look, accent navy).
export function Radio(props) {
  return <Checkbox type="radio" {...props} />;
}

// Field — label + optional hint/error around a single control. Generates an id,
// wires htmlFor + aria-describedby, and flags the control invalid on error.
export function Field({ label, hint, error, required, children, className = '' }) {
  const autoId = React.useId();
  const isEl = React.isValidElement(children);
  const controlId = (isEl && children.props.id) || autoId;
  const msgId = error ? `${controlId}-err` : hint ? `${controlId}-hint` : undefined;
  const control = isEl
    ? React.cloneElement(children, {
        id: controlId,
        invalid: error ? true : children.props.invalid,
        'aria-describedby': msgId || children.props['aria-describedby'],
      })
    : children;
  return (
    <div className={`mb-4 last:mb-0 ${className}`}>
      {label && (
        <label htmlFor={controlId} className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}{required && <span className="text-error-500"> *</span>}
        </label>
      )}
      {control}
      {error
        ? <p id={msgId} className="mt-1.5 text-xs font-medium text-error-700">{error}</p>
        : hint ? <p id={msgId} className="mt-1.5 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

// ─── Alert — info/success/warning/error callout banner ──────────────
const ALERT_TONES = {
  info: 'border-l-navy-500 bg-navy-50 text-ink-700',
  success: 'border-l-success-500 bg-success-100 text-success-700',
  warning: 'border-l-gold-400 bg-gold-50 text-ink-700',
  error: 'border-l-error-500 bg-error-100 text-error-700',
};
export function Alert({ tone = 'info', icon: Icon, children, className = '' }) {
  return (
    <div role="alert" className={`flex items-start gap-2.5 rounded-xl border-l-4 p-3.5 text-sm ${ALERT_TONES[tone]} ${className}`}>
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
      <div>{children}</div>
    </div>
  );
}

// ─── Segmented — pill toggle for a small set of mutually-exclusive values ──
export function Segmented({ label, value, options, onChange, size = 'm', className = '' }) {
  const pad = size === 's' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm';
  return (
    <div role="tablist" aria-label={label} className={`inline-flex rounded-xl border border-hairline bg-paper p-0.5 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={`rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 ${pad} ${active ? 'bg-navy-700 text-white' : 'text-ink-500 hover:text-navy-700'}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Tabs — underline tab bar for routed page sections (NavLink) ────────
export function Tabs({ items, className = '' }) {
  return (
    <div className={`flex gap-1 overflow-x-auto border-b border-hairline ${className}`}>
      {items.map(({ label, to, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) => `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-none ${isActive ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-500 hover:text-navy-700'}`}>
          {label}
        </NavLink>
      ))}
    </div>
  );
}

// ─── Breadcrumb — Tian OS › Section › Page ──────────────────────────
export function Breadcrumb({ items, className = '' }) {
  return (
    <nav aria-label="Breadcrumb" className={`mb-3 flex flex-wrap items-center gap-1.5 text-xs font-medium text-ink-500 ${className}`}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {it.to && !last
              ? <Link to={it.to} className="hover:text-navy-700">{it.label}</Link>
              : <span className={last ? 'font-semibold text-navy-700' : ''}>{it.label}</span>}
            {!last && <ChevronRight className="h-3.5 w-3.5 text-ink-300" aria-hidden />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Divider ────────────────────────────────────────────────────────
export function Divider({ className = '' }) {
  return <hr className={`border-0 border-t border-hairline ${className}`} />;
}

// ─── IconButton — square, accessible icon-only button ───────────────
const ICONBTN_VARIANTS = {
  ghost: 'text-ink-500 hover:bg-navy-50 hover:text-navy-700',
  secondary: 'border border-hairline bg-paper text-navy-700 hover:bg-navy-50',
};
export function IconButton({ icon: Icon, label, variant = 'ghost', size = 'm', className = '', ...rest }) {
  const dim = size === 's' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <button type="button" aria-label={label} title={label}
      className={`inline-grid place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 ${ICONBTN_VARIANTS[variant]} ${dim} ${className}`} {...rest}>
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

// ─── Avatar — initials fallback, optional image ─────────────────────
export function Avatar({ name = '', src, size = 'm', className = '' }) {
  const dim = size === 's' ? 'h-8 w-8 text-xs' : size === 'l' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  if (src) return <img src={src} alt={name} className={`rounded-full object-cover ${dim} ${className}`} />;
  return (
    <span aria-hidden className={`grid place-items-center rounded-full bg-navy-50 font-semibold text-navy-700 ${dim} ${className}`}>
      {initials}
    </span>
  );
}

// ─── Skeleton — loading placeholder ─────────────────────────────────
export function Skeleton({ className = '' }) {
  return <span className={`block animate-pulse rounded-md bg-bone ${className}`} />;
}

// ─── Tooltip — hover/focus label (CSS only) ─────────────────────────
export function Tooltip({ label, children, className = '' }) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </span>
    </span>
  );
}

// ─── Modal — centered dialog over a scrim (portal) ──────────────────
export function Modal({ open, onClose, title, children, footer, className = '' }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-lg rounded-2xl border border-hairline bg-paper shadow-active ${className}`}>
        <div className="flex items-start justify-between gap-3 border-b border-hairline p-5">
          <h2 className="font-display text-lg font-semibold text-navy-700">{title}</h2>
          <IconButton icon={X} label="Close" size="s" onClick={onClose} className="-mr-1.5 -mt-1.5" />
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-hairline p-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ─── Toast — transient notifications via context ────────────────────
const ToastContext = React.createContext(() => {});
export function useToast() { return React.useContext(ToastContext); }

const TOAST_TONES = {
  info: 'border-l-navy-500', success: 'border-l-success-500',
  warning: 'border-l-gold-400', error: 'border-l-error-500',
};
export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const toast = React.useCallback((message, { tone = 'info', duration = 4000 } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <div key={t.id} role="status"
              className={`flex items-start gap-2.5 rounded-xl border border-hairline border-l-4 bg-paper p-3.5 text-sm text-ink-700 shadow-active ${TOAST_TONES[t.tone]}`}>
              <span className="flex-1">{t.message}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-ink-300 hover:text-ink-700"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
