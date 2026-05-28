import React, { useState, useEffect, useRef } from 'react';
import { StickyNote, X } from 'lucide-react';
import api from '../../../services/api';

// Per-concept sticky note. Keyed by `heading` so a student's note follows the
// concept across every question variant that shares it (matches the legacy
// Science Lab convention). Autosaves on blur; an empty save clears the note.
export default function NoteWidget({ heading, topicName, initialText = '', onChange }) {
  const [text, setText] = useState(initialText);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const lastSaved = useRef(initialText);

  useEffect(() => { setText(initialText); lastSaved.current = initialText; }, [initialText, heading]);

  const save = async () => {
    if (text === lastSaved.current) return;
    setSaving(true);
    try {
      const { data } = await api.put('/science/student-notes', { heading, topicName, text });
      lastSaved.current = text;
      setSavedAt(Date.now());
      onChange?.(data.deleted ? '' : data.text);
    } catch {
      // soft-fail: leave the textarea content so the user can retry
    } finally {
      setSaving(false);
    }
  };

  if (!open && !text) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-500 hover:border-ink-300 hover:text-ink-700"
      >
        <StickyNote className="h-3.5 w-3.5" /> Add a note
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gold/40 bg-gold/5 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          <StickyNote className="h-3.5 w-3.5" /> My note
        </div>
        {open && (
          <button type="button" onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-700" aria-label="Collapse note">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          rows={3}
          maxLength={4000}
          placeholder="Jot down anything you want to remember about this concept…"
          className="block w-full resize-y rounded-md border border-ink-100 bg-paper p-2 text-sm text-ink-700 focus:border-[#2F6B7E] focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full whitespace-pre-wrap text-left text-sm text-ink-600 hover:text-ink-700"
        >
          {text}
        </button>
      )}
      <div className="mt-1 text-[11px] text-ink-400">
        {saving ? 'Saving…' : savedAt ? 'Saved' : (open ? 'Tap outside to save' : 'Tap to edit')}
      </div>
    </div>
  );
}
