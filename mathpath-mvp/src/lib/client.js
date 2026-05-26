'use client';

// client.js — tiny browser-side helpers for student identity + API calls.

const KEY = 'mathpath.student';

export function getStudent() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function setStudent(student) {
  localStorage.setItem(KEY, JSON.stringify(student));
}

export function studentId() {
  return getStudent()?.id || 'demo-student';
}

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const api = {
  recommendation: (id) => fetch(`/api/recommendation?studentId=${encodeURIComponent(id)}`).then((r) => r.json()),
  startSession: (id, skillId) => post('/api/session/start', { studentId: id, skillId }),
  attempt: (id, skill_id, operands, given) => post('/api/attempt', { studentId: id, skill_id, operands, given }),
  completeSession: (payload) => post('/api/session/complete', payload),
};
