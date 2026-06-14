import React, { useState } from 'react';
import { getMascot, MASCOTS, MASCOT_ORDER } from '../config/mascots';
import { useAuth } from '../context/AuthContext';
import { Check } from 'lucide-react';

export function MascotAvatar({ mascotKey, size = 48, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const mascot = getMascot(mascotKey);
  if (!mascot || imgError) return null;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, border: `3px solid ${mascot.color}` }}
    >
      <img
        src={`/mascots/${mascotKey}.png`}
        alt={mascot.name}
        className="h-full w-full object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export function AvatarPicker({ currentAvatar, onSelect, onClose }) {
  const [selected, setSelected] = useState(currentAvatar || null);
  const [saving, setSaving] = useState(false);
  const { updateProfile } = useAuth();

  const handleSave = async () => {
    if (!selected || selected === currentAvatar) { onClose?.(); return; }
    setSaving(true);
    const result = await updateProfile({ avatar: selected });
    setSaving(false);
    if (result.success) {
      onSelect?.(selected);
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold text-ink-900">Choose Your Avatar</h2>
        <p className="mt-1 text-sm text-ink-500">Pick a mascot to represent you across Tian OS.</p>

        <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-7">
          {MASCOT_ORDER.map((key) => {
            const m = MASCOTS[key];
            const isSelected = selected === key;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className="group flex flex-col items-center gap-1.5"
              >
                <div
                  className={`relative overflow-hidden rounded-full transition-all ${isSelected ? 'ring-2 ring-offset-2' : 'opacity-70 hover:opacity-100'}`}
                  style={{
                    width: 56, height: 56,
                    border: `3px solid ${m.color}`,
                    ...(isSelected ? { ringColor: m.color } : {}),
                  }}
                >
                  <img src={`/mascots/${key}.png`} alt={m.name} className="h-full w-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className={`text-xs font-semibold ${isSelected ? 'text-ink-900' : 'text-ink-400'}`}>{m.name}</span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-5 flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: MASCOTS[selected]?.colorLight }}>
            <MascotAvatar mascotKey={selected} size={40} />
            <div>
              <p className="text-sm font-semibold text-ink-900">{MASCOTS[selected]?.name}</p>
              <p className="text-xs text-ink-500">{MASCOTS[selected]?.role} · Age {MASCOTS[selected]?.age}</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-bone">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selected}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Avatar'}
          </button>
        </div>
      </div>
    </div>
  );
}
