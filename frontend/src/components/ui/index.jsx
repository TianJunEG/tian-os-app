import React from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { getMascotForModule } from '../../config/mascots';

// Tian OS shared UI primitives — Hanken Grotesk design system, all ages.
// Built on Tailwind tokens from tailwind.config.js + index.css. Reuse everywhere.

const CARD_TONES = {
  paper: 'bg-surface-white',
  emerald: 'bg-emerald-tint',
  mint: 'bg-emerald-tint',
  sunshine: 'bg-gold-tint',
  gold: 'bg-gold-tint',
  violet: 'bg-purple-tint',
  sky: 'bg-blue-tint',
  rose: 'bg-danger-tint',
  slate: 'bg-surface-raised',
  lavender: 'bg-purple-tint',
  peach: 'bg-danger-tint',
  yellow: 'bg-gold-tint',
};

export function Card({ children, className = '', interactive = false, tone = 'paper', ...rest }) {
  return (
    <div
      className={`rounded-card border border-line bg-surface-white shadow-rest ${CARD_TONES[tone] || CARD_TONES.paper} ${interactive ? 'transition hover:shadow-card hover:-translate-y-0.5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CollapsibleSection({
  title, summary, children, defaultOpen = false, className = '',
  contentClassName = '', action, surface = true,
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const Wrapper = surface ? Card : 'section';
  const wrapperClass = surface ? className : `rounded-card border border-line bg-transparent ${className}`;
  return (
    <Wrapper className={wrapperClass}>
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <button type="button"
          className="flex min-w-0 flex-1 items-start gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30"
          aria-expanded={open} onClick={() => setOpen((prev) => !prev)}>
          <span className="mt-0.5 shrink-0 text-body-faint">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-ink">{title}</span>
            {summary && <span className="mt-1 block text-sm text-body-muted">{summary}</span>}
          </span>
        </button>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {open && <div className={`border-t border-line p-4 sm:p-5 ${contentClassName}`}>{children}</div>}
    </Wrapper>
  );
}

const BTN_VARIANTS = {
  primary: 'bg-emerald text-white hover:bg-emerald-deep active:bg-emerald-deep',
  secondary: 'bg-surface-white text-body border-2 border-line-soft hover:bg-emerald-tint active:bg-emerald-tint',
  ghost: 'bg-transparent text-body-muted hover:bg-line-soft hover:text-ink active:bg-line',
  gold: 'bg-gold text-white hover:bg-gold-deep active:bg-gold-deep shadow-gold',
  outlineLight: 'bg-transparent text-white border-2 border-white/40 hover:bg-white/10',
};
const BTN_SIZES = {
  s: 'min-h-[44px] h-9 px-3.5 text-sm',
  m: 'h-[50px] px-5 text-[15.5px]',
  l: 'h-14 px-6 text-lg',
};

export function Button({ children, variant = 'primary', size = 'm', as, to, className = '', icon: Icon, ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition-all duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40 focus-visible:ring-offset-2 ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`;
  const content = (<>{Icon && <Icon className="h-[18px] w-[18px]" />}{children}</>);
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  const Tag = as || 'button';
  return <Tag className={cls} {...rest}>{content}</Tag>;
}

const BADGE_TONES = {
  neutral: 'bg-line text-body-muted',
  emerald: 'bg-emerald-tint text-emerald',
  success: 'bg-emerald-tint text-emerald',
  sunshine: 'bg-gold-tint text-gold-label',
  gold: 'bg-gold-tint text-gold-label',
  violet: 'bg-purple-tint text-purple',
  sky: 'bg-blue-tint text-blue',
  rose: 'bg-danger-tint text-danger-deep',
  error: 'bg-danger-tint text-danger-deep',
  danger: 'bg-danger-tint text-danger-deep',
  outline: 'bg-surface-white text-body border border-line',
  navy: 'bg-emerald-tint text-emerald',
  lavender: 'bg-purple-tint text-purple',
  mint: 'bg-emerald-tint text-emerald',
  peach: 'bg-danger-tint text-danger-deep',
  yellow: 'bg-gold-tint text-gold-label',
};
export function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-bold ${BADGE_TONES[tone] || BADGE_TONES.neutral} ${className}`}>{children}</span>;
}

const STATUS_MAP = {
  mastered: ['success', 'Mastered'], learning: ['emerald', 'Learning'],
  needs_review: ['rose', 'Needs review'], needs_support: ['rose', 'Needs support'],
  not_started: ['neutral', 'Not started'], in_progress: ['emerald', 'In progress'],
  completed: ['success', 'Completed'], overdue: ['rose', 'Overdue'],
  prepared: ['success', 'Prepared'], improving: ['success', 'Improving'], stable: ['emerald', 'Stable'],
  developing: ['sunshine', 'Developing'], practising: ['emerald', 'Practising'], fluent: ['success', 'Fluent'],
  // Mistake learning-status values
  new: ['rose', 'New mistake'],
  acknowledged: ['neutral', 'Reviewed'],
  correction_attempted: ['gold', 'Retry needed'],
  corrected: ['emerald', 'Corrected'],
  understood: ['navy', 'Understood'],
};
export function StatusBadge({ status }) {
  const [tone, label] = STATUS_MAP[status] || ['neutral', String(status || '').replace(/_/g, ' ')];
  return <Badge tone={tone}>{label}</Badge>;
}

export function ProgressBar({ value = 0, max = 100, className = '', barClassName = 'bg-emerald' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-pill bg-line ${className}`}>
      <div className={`h-full rounded-pill transition-[width] duration-500 ${barClassName}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatTile({ label, value, suffix }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-[0.06em] text-body-muted">{label}</div>
      <div className="font-mono text-2xl font-bold leading-none tracking-[-0.02em] text-emerald tabular-nums">
        {value}{suffix && <span className="ml-0.5 text-sm font-medium text-body-muted">{suffix}</span>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-base text-body-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, message, children, mascot }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {mascot ? (
        <img src={`/mascots/${mascot}.png`} alt="" className="h-16 w-16 rounded-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }} />
      ) : Icon ? (
        <span className="grid h-12 w-12 place-items-center rounded-shell bg-emerald-tint text-emerald"><Icon className="h-6 w-6" /></span>
      ) : null}
      <p className="max-w-sm text-base text-body-muted">{message}</p>
      {children}
    </Card>
  );
}

export function ErrorState({ message = "Couldn't load this. Try again?", onRetry }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-shell bg-danger-tint text-danger">!</span>
      <p className="max-w-sm text-base text-body">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-btn border border-line px-4 py-2 text-sm font-semibold text-emerald hover:bg-emerald-tint">
          Retry
        </button>
      )}
    </Card>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-body-muted">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-tint border-t-emerald" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function ModuleCard({ module, footer }) {
  const { name, purpose, icon: Icon, path, status, key } = module;
  const soon = status === 'soon';
  const mascot = getMascotForModule(key);
  const inner = (
    <Card interactive={!soon} className={`flex h-full flex-col p-5 ${soon ? 'opacity-70' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-shell bg-emerald-tint text-emerald"><Icon className="h-5 w-5" /></span>
        <div className="flex items-center gap-2">
          {mascot && (
            <img src={`/mascots/${mascot.key}.png`} alt={mascot.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-offset-1"
              style={{ '--tw-ring-color': mascot.color }}
              onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          {soon && <Badge tone="neutral">Coming soon</Badge>}
        </div>
      </div>
      <h3 className="font-semibold text-ink">{name}</h3>
      <p className="mt-1 flex-1 text-sm text-body-muted">{purpose}</p>
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
  if (soon) return <div aria-disabled className="cursor-default">{inner}</div>;
  return <Link to={path} className="block focus-visible:outline-none">{inner}</Link>;
}

const CONTROL_BASE =
  'w-full rounded-btn bg-surface-white text-sm text-ink placeholder:text-body-faint2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/20 disabled:cursor-not-allowed disabled:opacity-50';
const controlBorder = (invalid) =>
  invalid ? 'border border-danger focus-visible:border-danger' : 'border border-line-soft focus-visible:border-emerald';

export const Input = React.forwardRef(function Input({ icon: Icon, invalid, className = '', ...props }, ref) {
  const base = `${CONTROL_BASE} ${controlBorder(invalid)} h-11`;
  if (Icon) {
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-body-faint" aria-hidden />
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
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body-faint" aria-hidden />
    </div>
  );
});

export function Checkbox({ label, className = '', type = 'checkbox', ...props }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 text-sm text-ink ${className}`}>
      <input type={type}
        className="h-4 w-4 rounded border-line text-emerald accent-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30"
        {...props} />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Radio(props) { return <Checkbox type="radio" {...props} />; }

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
        <label htmlFor={controlId} className="mb-1.5 block text-sm font-semibold text-ink">
          {label}{required && <span className="text-danger"> *</span>}
        </label>
      )}
      {control}
      {error
        ? <p id={msgId} className="mt-1.5 text-xs font-medium text-danger">{error}</p>
        : hint ? <p id={msgId} className="mt-1.5 text-xs text-body-muted">{hint}</p> : null}
    </div>
  );
}

const ALERT_TONES = {
  info: 'border-l-emerald bg-emerald-tint text-ink',
  success: 'border-l-emerald bg-emerald-tint text-emerald',
  warning: 'border-l-gold bg-gold-tint text-ink',
  error: 'border-l-danger bg-danger-tint text-danger',
};
export function Alert({ tone = 'info', icon: Icon, children, className = '' }) {
  return (
    <div role="alert" className={`flex items-start gap-2.5 rounded-card border-l-4 p-3.5 text-sm ${ALERT_TONES[tone] || ALERT_TONES.info} ${className}`}>
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
      <div>{children}</div>
    </div>
  );
}

export function Segmented({ label, value, options, onChange, size = 'm', className = '' }) {
  const pad = size === 's' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm';
  return (
    <div role="tablist" aria-label={label} className={`inline-flex rounded-btn border border-line bg-surface-white p-0.5 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={`rounded-chip font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30 ${pad} ${active ? 'bg-emerald text-white' : 'text-body-muted hover:text-emerald'}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({ items, className = '' }) {
  return (
    <div className={`flex gap-1 overflow-x-auto border-b border-line ${className}`}>
      {items.map(({ label, to, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) => `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-none ${isActive ? 'border-emerald text-emerald' : 'border-transparent text-body-muted hover:text-emerald'}`}>
          {label}
        </NavLink>
      ))}
    </div>
  );
}

export function Breadcrumb({ items, className = '' }) {
  return (
    <nav aria-label="Breadcrumb" className={`mb-3 flex flex-wrap items-center gap-1.5 text-xs font-medium text-body-muted ${className}`}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {it.to && !last
              ? <Link to={it.to} className="hover:text-emerald">{it.label}</Link>
              : <span className={last ? 'font-bold text-ink' : ''}>{it.label}</span>}
            {!last && <ChevronRight className="h-3.5 w-3.5 text-line-strong" aria-hidden />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export function Divider({ className = '' }) {
  return <hr className={`border-0 border-t border-line ${className}`} />;
}

const ICONBTN_VARIANTS = {
  ghost: 'text-body-muted hover:bg-line hover:text-ink',
  secondary: 'border border-line bg-surface-white text-emerald hover:bg-emerald-tint',
};
export function IconButton({ icon: Icon, label, variant = 'ghost', size = 'm', className = '', ...rest }) {
  const dim = size === 's' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <button type="button" aria-label={label} title={label}
      className={`inline-grid place-items-center rounded-btn transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30 ${ICONBTN_VARIANTS[variant]} ${dim} ${className}`} {...rest}>
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

export function Avatar({ name = '', src, size = 'm', className = '' }) {
  const dim = size === 's' ? 'h-8 w-8 text-xs' : size === 'l' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  if (src) return <img src={src} alt={name} className={`rounded-full object-cover ${dim} ${className}`} />;
  return (
    <span aria-hidden className={`grid place-items-center rounded-full bg-emerald-tint font-bold text-emerald ${dim} ${className}`}>
      {initials}
    </span>
  );
}

export function Skeleton({ className = '' }) {
  return <span className={`block animate-pulse rounded-btn bg-line ${className}`} />;
}

export function Tooltip({ label, children, className = '' }) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-chip bg-ink px-2 py-1 text-xs font-medium text-dark-text opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </span>
    </span>
  );
}

export function Modal({ open, onClose, title, children, footer, className = '', containerClassName = 'p-4', bodyClassName = '' }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className={`fixed inset-0 z-[90] flex items-center justify-center ${containerClassName}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col rounded-shell border border-line bg-surface-white shadow-card ${className}`}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line p-5">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <IconButton icon={X} label="Close" size="s" onClick={onClose} className="-mr-1.5 -mt-1.5" />
        </div>
        <div className={`flex-1 overflow-y-auto p-5 ${bodyClassName}`}>{children}</div>
        {footer && <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-line p-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

const ToastContext = React.createContext(() => {});
export function useToast() { return React.useContext(ToastContext); }

const TOAST_TONES = {
  info: 'border-l-emerald', success: 'border-l-emerald',
  warning: 'border-l-gold', error: 'border-l-danger',
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
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] right-4 z-[100] flex max-w-sm flex-col gap-2 md:bottom-4">
          {toasts.map((t) => (
            <div key={t.id} role="status"
              className={`flex items-start gap-2.5 rounded-card border border-line border-l-4 bg-surface-white p-3.5 text-sm text-body shadow-card ${TOAST_TONES[t.tone] || TOAST_TONES.info}`}>
              <span className="flex-1">{t.message}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-body-faint hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
