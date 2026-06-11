import React from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

// Tian OS shared UI primitives — emerald green design system for ages 7–12.
// Nunito font, rounded shapes, warm celebrations. Built on Tailwind tokens
// from tailwind.config.js + index.css. Reuse everywhere.

// ─── Card ───────────────────────────────────────────────────────────
const CARD_TONES = {
  paper: 'bg-paper',
  emerald: 'bg-tint-emerald',
  mint: 'bg-tint-emerald',
  sunshine: 'bg-tint-sunshine',
  violet: 'bg-tint-violet',
  sky: 'bg-tint-sky',
  rose: 'bg-tint-rose',
  slate: 'bg-tint-slate',
  // Legacy aliases
  lavender: 'bg-tint-violet',
  peach: 'bg-tint-rose',
  yellow: 'bg-tint-sunshine',
};

export function Card({ children, className = '', interactive = false, tone = 'paper', ...rest }) {
  return (
    <div
      className={`rounded-[20px] border border-slate-200/70 ${CARD_TONES[tone] || CARD_TONES.paper} shadow-resting ${interactive ? 'transition hover:shadow-active hover:-translate-y-0.5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CollapsibleSection({
  title,
  summary,
  children,
  defaultOpen = false,
  className = '',
  contentClassName = '',
  action,
  surface = true,
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const Wrapper = surface ? Card : 'section';
  const wrapperClass = surface ? className : `rounded-[20px] border border-slate-200 bg-transparent ${className}`;
  return (
    <Wrapper className={wrapperClass}>
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="mt-0.5 shrink-0 text-slate-400">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-700">{title}</span>
            {summary && <span className="mt-1 block text-sm text-slate-500">{summary}</span>}
          </span>
        </button>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {open && <div className={`border-t border-slate-200 p-4 sm:p-5 ${contentClassName}`}>{children}</div>}
    </Wrapper>
  );
}

// ─── Button ─────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
  secondary: 'bg-paper text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 active:bg-emerald-100',
  ghost: 'bg-transparent text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100',
  gold: 'bg-sunshine-400 text-slate-900 hover:bg-sunshine-500 active:bg-sunshine-600',
  outlineLight: 'bg-transparent text-white border-2 border-white/40 hover:bg-white/10',
};
const BTN_SIZES = {
  s: 'h-9 px-3.5 text-sm',
  m: 'h-[52px] px-5 text-base',
  l: 'h-14 px-6 text-lg',
};

export function Button({ children, variant = 'primary', size = 'm', as, to, className = '', icon: Icon, ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-[14px] font-bold tracking-[-0.01em] transition-all duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`;
  const content = (<>{Icon && <Icon className="h-[18px] w-[18px]" />}{children}</>);
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  const Tag = as || 'button';
  return <Tag className={cls} {...rest}>{content}</Tag>;
}

// ─── Badge / StatusBadge ────────────────────────────────────────────
const BADGE_TONES = {
  neutral: 'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-100 text-emerald-800',
  success: 'bg-emerald-100 text-emerald-800',
  sunshine: 'bg-sunshine-100 text-sunshine-700',
  gold: 'bg-sunshine-100 text-sunshine-700',
  violet: 'bg-violet-100 text-violet-700',
  sky: 'bg-sky-100 text-sky-700',
  rose: 'bg-rose-100 text-rose-700',
  error: 'bg-rose-100 text-rose-700',
  outline: 'bg-paper text-slate-700 border border-slate-200',
  // Legacy aliases
  navy: 'bg-emerald-100 text-emerald-800',
  lavender: 'bg-violet-100 text-violet-700',
  mint: 'bg-emerald-100 text-emerald-800',
  peach: 'bg-rose-100 text-rose-700',
  yellow: 'bg-sunshine-100 text-sunshine-700',
};
export function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE_TONES[tone]} ${className}`}>{children}</span>;
}

// Maps domain statuses to a fixed tone + label.
const STATUS_MAP = {
  mastered: ['success', 'Mastered'], learning: ['emerald', 'Learning'],
  needs_review: ['rose', 'Needs review'], needs_support: ['rose', 'Needs support'],
  not_started: ['neutral', 'Not started'], in_progress: ['emerald', 'In progress'],
  completed: ['success', 'Completed'], overdue: ['rose', 'Overdue'],
  prepared: ['success', 'Prepared'], improving: ['success', 'Improving'], stable: ['emerald', 'Stable'],
  developing: ['sunshine', 'Developing'], practising: ['emerald', 'Practising'], fluent: ['success', 'Fluent'],
};
export function StatusBadge({ status }) {
  const [tone, label] = STATUS_MAP[status] || ['neutral', String(status || '').replace(/_/g, ' ')];
  return <Badge tone={tone}>{label}</Badge>;
}

// ─── ProgressBar ────────────────────────────────────────────────────
export function ProgressBar({ value = 0, max = 100, className = '', barClassName = 'bg-emerald-500' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div className={`h-full rounded-full transition-[width] duration-500 ${barClassName}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── StatTile — small KPI ───────────────────────────────────────────
export function StatTile({ label, value, suffix }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-[0.06em] text-slate-500">{label}</div>
      <div className="font-mono text-2xl font-bold leading-none tracking-[-0.02em] text-emerald-700 tabular-nums">
        {value}{suffix && <span className="ml-0.5 text-sm font-medium text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── PageHeader ─────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-800">{title}</h1>
        {subtitle && <p className="mt-1 text-base text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, message, children }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {Icon && <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon className="h-6 w-6" /></span>}
      <p className="max-w-sm text-base text-slate-500">{message}</p>
      {children}
    </Card>
  );
}

// ─── ErrorState ─────────────────────────────────────────────────────
export function ErrorState({ message = "Couldn't load this. Try again?", onRetry }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-600">!</span>
      <p className="max-w-sm text-base text-slate-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-[14px] border border-slate-200 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
        >
          Retry
        </button>
      )}
    </Card>
  );
}

// ─── Spinner ────────────────────────────────────────────────────────
export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-600" />
      <span className="text-sm font-medium">{label}</span>
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
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Icon className="h-5 w-5" /></span>
        {soon && <Badge tone="neutral">Coming soon</Badge>}
      </div>
      <h3 className="font-bold text-slate-700">{name}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-500">{purpose}</p>
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
  if (soon) return <div aria-disabled className="cursor-default">{inner}</div>;
  return <Link to={path} className="block focus-visible:outline-none">{inner}</Link>;
}

// ─── Form controls ──────────────────────────────────────────────────
const CONTROL_BASE =
  'w-full rounded-xl bg-paper text-base sm:text-sm text-slate-700 placeholder:text-slate-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-50';
const controlBorder = (invalid) =>
  invalid ? 'border border-rose-500 focus-visible:border-rose-500' : 'border border-slate-200 focus-visible:border-emerald-400';

export const Input = React.forwardRef(function Input({ icon: Icon, invalid, className = '', ...props }, ref) {
  const base = `${CONTROL_BASE} ${controlBorder(invalid)} h-11`;
  if (Icon) {
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden />
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
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
    </div>
  );
});

export function Checkbox({ label, className = '', type = 'checkbox', ...props }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 ${className}`}>
      <input type={type}
        className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
        {...props} />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Radio(props) {
  return <Checkbox type="radio" {...props} />;
}

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
        <label htmlFor={controlId} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}{required && <span className="text-rose-500"> *</span>}
        </label>
      )}
      {control}
      {error
        ? <p id={msgId} className="mt-1.5 text-xs font-medium text-rose-700">{error}</p>
        : hint ? <p id={msgId} className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

// ─── Alert ──────────────────────────────────────────────────────────
const ALERT_TONES = {
  info: 'border-l-emerald-500 bg-emerald-50 text-slate-700',
  success: 'border-l-emerald-500 bg-emerald-50 text-emerald-800',
  warning: 'border-l-sunshine-400 bg-sunshine-50 text-slate-700',
  error: 'border-l-rose-500 bg-rose-50 text-rose-800',
};
export function Alert({ tone = 'info', icon: Icon, children, className = '' }) {
  return (
    <div role="alert" className={`flex items-start gap-2.5 rounded-xl border-l-4 p-3.5 text-sm ${ALERT_TONES[tone]} ${className}`}>
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
      <div>{children}</div>
    </div>
  );
}

// ─── Segmented ──────────────────────────────────────────────────────
export function Segmented({ label, value, options, onChange, size = 'm', className = '' }) {
  const pad = size === 's' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm';
  return (
    <div role="tablist" aria-label={label} className={`inline-flex rounded-xl border border-slate-200 bg-paper p-0.5 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={`rounded-lg font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 ${pad} ${active ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-700'}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────
export function Tabs({ items, className = '' }) {
  return (
    <div className={`flex gap-1 overflow-x-auto border-b border-slate-200 ${className}`}>
      {items.map(({ label, to, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) => `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-bold transition focus-visible:outline-none ${isActive ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-emerald-700'}`}>
          {label}
        </NavLink>
      ))}
    </div>
  );
}

// ─── Breadcrumb ─────────────────────────────────────────────────────
export function Breadcrumb({ items, className = '' }) {
  return (
    <nav aria-label="Breadcrumb" className={`mb-3 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 ${className}`}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {it.to && !last
              ? <Link to={it.to} className="hover:text-emerald-700">{it.label}</Link>
              : <span className={last ? 'font-bold text-slate-700' : ''}>{it.label}</span>}
            {!last && <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Divider ────────────────────────────────────────────────────────
export function Divider({ className = '' }) {
  return <hr className={`border-0 border-t border-slate-200 ${className}`} />;
}

// ─── IconButton ─────────────────────────────────────────────────────
const ICONBTN_VARIANTS = {
  ghost: 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700',
  secondary: 'border border-slate-200 bg-paper text-emerald-700 hover:bg-emerald-50',
};
export function IconButton({ icon: Icon, label, variant = 'ghost', size = 'm', className = '', ...rest }) {
  const dim = size === 's' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <button type="button" aria-label={label} title={label}
      className={`inline-grid place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 ${ICONBTN_VARIANTS[variant]} ${dim} ${className}`} {...rest}>
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────────
export function Avatar({ name = '', src, size = 'm', className = '' }) {
  const dim = size === 's' ? 'h-8 w-8 text-xs' : size === 'l' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  if (src) return <img src={src} alt={name} className={`rounded-full object-cover ${dim} ${className}`} />;
  return (
    <span aria-hidden className={`grid place-items-center rounded-full bg-emerald-50 font-bold text-emerald-700 ${dim} ${className}`}>
      {initials}
    </span>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <span className={`block animate-pulse rounded-md bg-slate-100 ${className}`} />;
}

// ─── Tooltip ────────────────────────────────────────────────────────
export function Tooltip({ label, children, className = '' }) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </span>
    </span>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, className = '', containerClassName = 'p-4' }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className={`fixed inset-0 z-[90] flex items-center justify-center ${containerClassName}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-lg rounded-[20px] border border-slate-200 bg-paper shadow-active ${className}`}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <h2 className="font-display text-lg font-bold text-slate-800">{title}</h2>
          <IconButton icon={X} label="Close" size="s" onClick={onClose} className="-mr-1.5 -mt-1.5" />
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 p-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ─── Toast ──────────────────────────────────────────────────────────
const ToastContext = React.createContext(() => {});
export function useToast() { return React.useContext(ToastContext); }

const TOAST_TONES = {
  info: 'border-l-emerald-500', success: 'border-l-emerald-500',
  warning: 'border-l-sunshine-400', error: 'border-l-rose-500',
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
              className={`flex items-start gap-2.5 rounded-xl border border-slate-200 border-l-4 bg-paper p-3.5 text-sm text-slate-700 shadow-active ${TOAST_TONES[t.tone]}`}>
              <span className="flex-1">{t.message}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
