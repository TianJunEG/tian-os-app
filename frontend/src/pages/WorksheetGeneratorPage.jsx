import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Upload,
  Sparkles,
  Printer,
  AlertCircle,
  Trash2,
  FileText,
  Loader,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { worksheetsAPI, studentsAPI } from '../services/api';
import './WorksheetGeneratorPage.css';

const FILE_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

// Downscale large photos in the browser before upload: keeps requests small,
// uploads fast, and well within the vision model's image-size limits.
function resizeImage(file, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image.'))),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image. Try a JPEG or PNG photo.'));
    };
    img.src = url;
  });
}

const difficultyStyles = {
  easier: 'bg-green-100 text-green-800',
  similar: 'bg-blue-100 text-blue-800',
  harder: 'bg-orange-100 text-orange-800'
};

function startOfDay(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

function dayDiff(date) {
  return Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000);
}

function relativeLabel(date) {
  const d = dayDiff(date);
  if (d === 0) return 'Today';
  if (d < 0) return `${-d}d overdue`;
  return `in ${d}d`;
}

function dueStatus(w) {
  if (w.sessionsTotal && w.sessionsCompleted >= w.sessionsTotal) {
    return { label: 'Complete', cls: 'bg-green-100 text-green-800' };
  }
  if (!w.nextDueAt) return { label: '—', cls: 'bg-gray-100 text-gray-600' };
  const d = dayDiff(w.nextDueAt);
  if (d < 0) return { label: 'Overdue', cls: 'bg-red-100 text-red-800' };
  if (d === 0) return { label: 'Due today', cls: 'bg-yellow-100 text-yellow-800' };
  return { label: `Due in ${d}d`, cls: 'bg-blue-100 text-blue-800' };
}

function toDateInputValue(date) {
  const d = new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function scoreClass(s) {
  if (s >= 80) return 'bg-green-100 text-green-800';
  if (s >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export default function WorksheetGeneratorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [topicHint, setTopicHint] = useState('');
  const [questionsPerSession, setQuestionsPerSession] = useState('5');
  const [assignStudentId, setAssignStudentId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [worksheet, setWorksheet] = useState(null);
  const [teacherView, setTeacherView] = useState(true);
  const [activeSession, setActiveSession] = useState(1);
  const [escalatedNote, setEscalatedNote] = useState(null);

  // Per-question answer entry
  const [answerMode, setAnswerMode] = useState({}); // i -> 'type' | 'draw'
  const [typed, setTyped] = useState({}); // i -> string
  const [drawn, setDrawn] = useState({}); // i -> bool (canvas has strokes)
  const [marking, setMarking] = useState(false);
  const [reinforcing, setReinforcing] = useState(false);

  const canvasRefs = useRef({});
  const drawState = useRef({ drawing: false, x: 0, y: 0 });

  const [history, setHistory] = useState([]);
  const [students, setStudents] = useState([]);
  const [mistakes, setMistakes] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadHistory();
    loadMistakes();
    if (!isStudent) loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Reset answer entry whenever the worksheet or active session changes.
  useEffect(() => {
    setAnswerMode({});
    setTyped({});
    setDrawn({});
    canvasRefs.current = {};
  }, [worksheet?._id, activeSession]);

  const loadHistory = async () => {
    try {
      const res = await worksheetsAPI.list();
      setHistory(res.data.worksheets || []);
    } catch (err) {
      console.error('Failed to load worksheet history:', err);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await studentsAPI.list();
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const loadMistakes = async () => {
    try {
      const res = await worksheetsAPI.mistakes();
      setMistakes(res.data.mistakes || []);
    } catch (err) {
      console.error('Failed to load mistakes:', err);
    }
  };

  const adoptWorksheet = (w) => {
    setWorksheet(w);
    setTeacherView(!isStudent);
    const sessions = w.practiceSessions || [];
    const next = sessions.find((s) => !s.completed) || sessions[0];
    setActiveSession(next ? next.sessionNumber : 1);
  };

  // When the server offloads generation to the background worker it returns a
  // 202 with a 'pending' worksheet; poll GET /:id until it's ready or failed.
  const pollWorksheetReady = async (id, { tries = 40, intervalMs = 2000 } = {}) => {
    for (let i = 0; i < tries; i += 1) {
      await new Promise((r) => setTimeout(r, intervalMs));
      const res = await worksheetsAPI.get(id);
      const w = res.data.worksheet;
      if (w?.generationStatus === 'ready') return w;
      if (w?.generationStatus === 'failed') {
        throw new Error(w.generationError || 'Worksheet generation failed.');
      }
    }
    throw new Error('Worksheet is taking longer than expected. Check your history shortly.');
  };

  // Async marking returns 202; poll GET /:id until the session is marked/failed.
  const pollSessionMarked = async (id, sessionNumber, { tries = 40, intervalMs = 2000 } = {}) => {
    for (let i = 0; i < tries; i += 1) {
      await new Promise((r) => setTimeout(r, intervalMs));
      const res = await worksheetsAPI.get(id);
      const w = res.data.worksheet;
      const session = (w?.practiceSessions || []).find((s) => s.sessionNumber === sessionNumber);
      if (session?.markingStatus === 'marked') return w;
      if (session?.markingStatus === 'failed') {
        throw new Error(session.markingError || 'Marking failed.');
      }
    }
    throw new Error('Marking is taking longer than expected. Check back shortly.');
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a photo of the marked work first.');
      return;
    }

    setLoading(true);
    setError(null);
    setWorksheet(null);

    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append('work', resized, 'work.jpg');
      if (studentName) formData.append('studentName', studentName);
      if (gradeLevel) formData.append('gradeLevel', gradeLevel);
      if (topicHint) formData.append('topicHint', topicHint);
      if (assignStudentId) formData.append('studentId', assignStudentId);
      formData.append('questionsPerSession', questionsPerSession);

      const res = await worksheetsAPI.generate(formData);
      // 202 + queued → the worker is generating; poll until it's ready.
      const worksheetReady = res.data.queued
        ? await pollWorksheetReady(res.data.worksheet._id)
        : res.data.worksheet;
      adoptWorksheet(worksheetReady);
      setEscalatedNote(res.data.escalated ? `Handwriting was unclear — read with ${res.data.modelUsed}.` : null);
      loadHistory();
      loadMistakes();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong generating the worksheet.');
    } finally {
      setLoading(false);
    }
  };

  const openWorksheet = async (id) => {
    setError(null);
    try {
      const res = await worksheetsAPI.get(id);
      adoptWorksheet(res.data.worksheet);
      setEscalatedNote(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not open that worksheet.');
    }
  };

  const updateSession = async (sessionNumber, payload) => {
    try {
      const res = await worksheetsAPI.updateSession(worksheet._id, sessionNumber, payload);
      setWorksheet(res.data.worksheet);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update the session.');
    }
  };

  const deleteWorksheet = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this worksheet?')) return;
    try {
      await worksheetsAPI.remove(id);
      if (worksheet?._id === id) setWorksheet(null);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete that worksheet.');
    }
  };

  // --- drawing canvas helpers ---
  const setMode = (i, m) => setAnswerMode((prev) => ({ ...prev, [i]: m }));

  const initCanvas = (el) => {
    if (!el || el._inited) return;
    const ctx = el.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, el.width, el.height);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    el._inited = true;
  };

  const canvasPos = (el, e) => {
    const r = el.getBoundingClientRect();
    const t = e.touches && e.touches[0];
    const cx = t ? t.clientX : e.clientX;
    const cy = t ? t.clientY : e.clientY;
    return { x: (cx - r.left) * (el.width / r.width), y: (cy - r.top) * (el.height / r.height) };
  };

  const onDown = (i, e) => {
    const el = canvasRefs.current[i];
    if (!el) return;
    e.preventDefault();
    const p = canvasPos(el, e);
    drawState.current = { drawing: true, x: p.x, y: p.y };
  };

  const onMove = (i, e) => {
    if (!drawState.current.drawing) return;
    const el = canvasRefs.current[i];
    if (!el) return;
    e.preventDefault();
    const p = canvasPos(el, e);
    const ctx = el.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(drawState.current.x, drawState.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    drawState.current.x = p.x;
    drawState.current.y = p.y;
    setDrawn((prev) => (prev[i] ? prev : { ...prev, [i]: true }));
  };

  const onUp = () => {
    drawState.current.drawing = false;
  };

  const clearCanvas = (i) => {
    const el = canvasRefs.current[i];
    if (!el) return;
    const ctx = el.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, el.width, el.height);
    ctx.strokeStyle = '#111827';
    setDrawn((prev) => {
      const n = { ...prev };
      delete n[i];
      return n;
    });
  };

  const submitForMarking = async () => {
    if (!activeSessionObj) return;
    const answers = [];
    activeSessionObj.questions.forEach((q, i) => {
      const mode = answerMode[i] || 'type';
      if (mode === 'draw') {
        if (drawn[i] && canvasRefs.current[i]) {
          answers.push({ questionIndex: i, type: 'image', imageDataUrl: canvasRefs.current[i].toDataURL('image/jpeg', 0.85) });
        }
      } else {
        const t = (typed[i] || '').trim();
        if (t) answers.push({ questionIndex: i, type: 'text', text: t });
      }
    });

    if (answers.length === 0) {
      setError('Write or type at least one answer first.');
      return;
    }

    setMarking(true);
    setError(null);
    try {
      const res = await worksheetsAPI.markSession(worksheet._id, activeSessionObj.sessionNumber, { answers });
      // 202 + queued → the worker is marking; poll until the session is done.
      const marked = res.data.queued
        ? await pollSessionMarked(res.data.worksheetId, res.data.sessionNumber)
        : res.data.worksheet;
      setWorksheet(marked);
      setEscalatedNote(res.data.escalated ? `Handwriting was unclear — re-read with ${res.data.modelUsed}.` : null);
      loadHistory();
      loadMistakes();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not mark the answers.');
    } finally {
      setMarking(false);
    }
  };

  const handleReinforce = async () => {
    setReinforcing(true);
    setError(null);
    try {
      const res = await worksheetsAPI.reinforce(worksheet._id, { misconceptionTitles: missedTitles });
      adoptWorksheet(res.data.worksheet);
      setEscalatedNote(null);
      loadHistory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not generate targeted practice.');
    } finally {
      setReinforcing(false);
    }
  };

  const sessions = worksheet?.practiceSessions || [];
  const activeSessionObj = sessions.find((s) => s.sessionNumber === activeSession) || sessions[0];
  const isMarked = !!activeSessionObj?.marked;
  const answeredCount = activeSessionObj
    ? activeSessionObj.questions.filter((q) => q.correct === true || q.correct === false).length
    : 0;
  const correctCount = activeSessionObj
    ? activeSessionObj.questions.filter((q) => q.correct === true).length
    : 0;
  const missedTitles = isMarked
    ? [...new Set(activeSessionObj.questions.filter((q) => q.correct === false).map((q) => q.targetsMisconception).filter(Boolean))]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40 no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gold-600">AI remediation</div>
              <h1 className="text-3xl font-serif font-medium text-navy-900 leading-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-gold-500" />
                {isStudent ? 'My Practice' : 'Math Worksheet Generator'}
              </h1>
              <p className="text-gray-500 text-sm">
                {isStudent
                  ? 'Do your practice and review your mistakes'
                  : 'Upload marked work → diagnose → practice → auto-mark'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Upload form (guardians only) */}
        {!isStudent && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 no-print">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo of marked work <span className="text-red-500">*</span>
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-navy-400 transition h-56 overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Selected work" className="h-full w-full object-contain" />
                  ) : (
                    <div className="text-center p-6">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Tap to upload a photo</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP or GIF</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student name (optional)</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade / level (optional)</label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="e.g. Year 5, Grade 7, Algebra I"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic hint (optional)</label>
                  <input
                    type="text"
                    value={topicHint}
                    onChange={(e) => setTopicHint(e.target.value)}
                    placeholder="e.g. adding fractions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Questions per session</label>
                  <select
                    value={questionsPerSession}
                    onChange={(e) => setQuestionsPerSession(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  >
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Builds 3 spaced sessions — today, +2 days, +7 days — for mastery.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to a student (optional)</label>
              {students.length > 0 ? (
                <select
                  value={assignStudentId}
                  onChange={(e) => setAssignStudentId(e.target.value)}
                  className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                >
                  <option value="">— Not assigned —</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500">
                  No student logins yet.{' '}
                  <button type="button" onClick={() => navigate('/students')} className="text-navy-600 hover:underline">
                    Add one
                  </button>{' '}
                  so they can do this practice when they log in.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate practice plan
                </>
              )}
            </button>
          </form>
        )}

        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center no-print">
            <Loader className="w-10 h-10 text-navy-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Reading the work and building spaced practice…</p>
            <p className="text-gray-500 text-sm mt-1">This can take up to a minute.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 no-print">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {worksheet && (
          <div className="space-y-4">
            {/* Controls (not printed) */}
            <div className="flex flex-wrap items-center justify-between gap-3 no-print">
              {isStudent ? (
                <div />
              ) : (
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={teacherView}
                      onChange={(e) => setTeacherView(e.target.checked)}
                      className="rounded text-navy-600 focus:ring-navy-500"
                    />
                    Teacher view (show diagnosis &amp; answers)
                  </label>
                  {!isMarked && (
                    <p className="text-xs text-gray-400 mt-1">Uncheck so the student can answer in-app.</p>
                  )}
                </div>
              )}
              {activeSessionObj && (
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm font-medium"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save session as PDF
                </button>
              )}
            </div>

            {escalatedNote && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 no-print">
                {escalatedNote}
              </div>
            )}

            {/* Diagnosis (teacher view, on-screen only) */}
            {teacherView && (
              <div className="bg-white rounded-lg shadow p-6 space-y-4 no-print">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{worksheet.topic || 'Diagnosis'}</h2>
                  {worksheet.overallSummary && (
                    <p className="text-gray-700 text-sm mt-1 whitespace-pre-line">{worksheet.overallSummary}</p>
                  )}
                </div>

                {worksheet.misconceptions?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Misconceptions to tackle</h3>
                    <div className="space-y-3">
                      {worksheet.misconceptions.map((m, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-3">
                          <p className="font-medium text-gray-900">{m.title}</p>
                          <p className="text-sm text-gray-700 mt-1">{m.description}</p>
                          {m.evidence && (
                            <p className="text-xs text-gray-500 mt-2">
                              <span className="font-medium">Evidence:</span> {m.evidence}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {worksheet.skillsToReinforce?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Skills to reinforce</h3>
                    <div className="flex flex-wrap gap-2">
                      {worksheet.skillsToReinforce.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {worksheet.sourceImageUrl && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Original work</h3>
                    <img
                      src={`${FILE_BASE}${worksheet.sourceImageUrl}`}
                      alt="Original marked work"
                      className="max-h-72 rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Session tabs */}
            {sessions.length > 0 && (
              <div className="flex flex-wrap gap-2 no-print">
                {sessions.map((s) => {
                  const active = s.sessionNumber === activeSessionObj?.sessionNumber;
                  return (
                    <button
                      key={s.sessionNumber}
                      onClick={() => setActiveSession(s.sessionNumber)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition ${
                        active
                          ? 'bg-navy-600 text-white border-navy-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-navy-400'
                      }`}
                    >
                      {s.completed ? (
                        <CheckCircle className={`w-4 h-4 ${active ? 'text-white' : 'text-green-600'}`} />
                      ) : (
                        <Calendar className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                      )}
                      <span>Session {s.sessionNumber}</span>
                      <span className={active ? 'text-navy-100' : 'text-gray-400'}>
                        · {s.completed ? (s.score != null ? `${s.score}%` : 'done') : relativeLabel(s.scheduledFor)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Session scheduling controls (teacher view) */}
            {activeSessionObj && teacherView && (
              <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4 no-print">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <label className="text-sm text-gray-700">Scheduled for</label>
                  <input
                    type="date"
                    value={toDateInputValue(activeSessionObj.scheduledFor)}
                    onChange={(e) => updateSession(activeSessionObj.sessionNumber, { scheduledFor: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={activeSessionObj.completed}
                    onChange={(e) => updateSession(activeSessionObj.sessionNumber, { completed: e.target.checked })}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  Mark this session complete
                </label>
              </div>
            )}

            {/* Printable session sheet */}
            <div className="bg-white rounded-lg shadow p-6 sm:p-8 print-area">
              {activeSessionObj ? (
                <>
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {worksheet.topic || 'Math Practice'} — Session {activeSessionObj.sessionNumber} of {sessions.length}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {worksheet.studentName ? `${worksheet.studentName} • ` : ''}
                      {worksheet.gradeLevel ? `${worksheet.gradeLevel} • ` : ''}
                      Scheduled for {new Date(activeSessionObj.scheduledFor).toLocaleDateString()}
                    </p>
                    {isMarked && (
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${scoreClass(activeSessionObj.score || 0)}`}>
                        Score: {activeSessionObj.score}% · {correctCount}/{answeredCount} correct
                      </span>
                    )}
                  </div>

                  <ol className="space-y-5">
                    {activeSessionObj.questions.map((q, i) => {
                      const mode = answerMode[i] || 'type';
                      return (
                        <li key={i} className="worksheet-question">
                          <div className="flex items-start gap-3">
                            <span className="font-semibold text-gray-900">{i + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-gray-900">{q.prompt}</p>
                                {teacherView && q.difficulty && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                      difficultyStyles[q.difficulty] || 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {q.difficulty}
                                  </span>
                                )}
                              </div>

                              {/* Marked result */}
                              {isMarked && (q.correct === true || q.correct === false) && (
                                <div className={`mt-2 rounded-lg p-2 ${q.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                                  <div className="flex items-center gap-2 text-sm">
                                    {q.correct ? (
                                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                    )}
                                    <span className={q.correct ? 'text-green-800 font-medium' : 'text-red-800 font-medium'}>
                                      {q.correct ? 'Correct' : 'Not quite'}
                                    </span>
                                    {q.studentResponse && (
                                      <span className="text-gray-500">· you wrote: {q.studentResponse}</span>
                                    )}
                                  </div>
                                  {q.feedback && <p className="text-sm text-gray-700 mt-1">{q.feedback}</p>}
                                </div>
                              )}

                              {/* Teacher answer / solution */}
                              {teacherView && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm text-green-700">
                                    <span className="font-medium">Answer:</span> {q.answer}
                                  </p>
                                  {q.workedSolution && (
                                    <p className="text-sm text-gray-600 whitespace-pre-line">
                                      <span className="font-medium">Solution:</span> {q.workedSolution}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Student answer entry */}
                              {!isMarked && !teacherView && (
                                <div className="mt-3 no-print">
                                  <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden mb-2 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setMode(i, 'type')}
                                      className={`px-3 py-1 ${mode === 'type' ? 'bg-navy-600 text-white' : 'bg-white text-gray-600'}`}
                                    >
                                      Type
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMode(i, 'draw')}
                                      className={`px-3 py-1 ${mode === 'draw' ? 'bg-navy-600 text-white' : 'bg-white text-gray-600'}`}
                                    >
                                      Draw
                                    </button>
                                  </div>
                                  {mode === 'type' ? (
                                    <input
                                      type="text"
                                      value={typed[i] || ''}
                                      onChange={(e) => setTyped((p) => ({ ...p, [i]: e.target.value }))}
                                      placeholder="Your answer"
                                      className="block w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                                    />
                                  ) : (
                                    <div>
                                      <canvas
                                        key={`canvas-${activeSessionObj.sessionNumber}-${i}`}
                                        ref={(el) => {
                                          canvasRefs.current[i] = el;
                                          initCanvas(el);
                                        }}
                                        width={700}
                                        height={140}
                                        onMouseDown={(e) => onDown(i, e)}
                                        onMouseMove={(e) => onMove(i, e)}
                                        onMouseUp={onUp}
                                        onMouseLeave={onUp}
                                        onTouchStart={(e) => onDown(i, e)}
                                        onTouchMove={(e) => onMove(i, e)}
                                        onTouchEnd={onUp}
                                        className="w-full border border-gray-300 rounded bg-white"
                                        style={{ touchAction: 'none', maxWidth: '100%' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => clearCanvas(i)}
                                        className="text-xs text-gray-500 mt-1 hover:text-gray-700"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  {!isMarked && !teacherView && (
                    <div className="mt-6 no-print">
                      <button
                        onClick={submitForMarking}
                        disabled={marking}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 disabled:opacity-50 transition font-medium"
                      >
                        {marking ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Marking…
                          </>
                        ) : (
                          'Submit for marking'
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-800 text-sm">
                    {worksheet.overallSummary ||
                      "No practice questions could be generated from this image. Try a clearer photo of the marked work."}
                  </p>
                </div>
              )}
            </div>

            {/* Close the loop: reinforce on missed misconceptions */}
            {isMarked && activeSessionObj && (
              <div className="no-print">
                {missedTitles.length > 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-amber-900">Missed: {missedTitles.join(', ')}</p>
                      {!isStudent && (
                        <p className="text-sm text-amber-700">Generate a fresh spaced plan targeting just these.</p>
                      )}
                    </div>
                    {!isStudent && (
                      <button
                        onClick={handleReinforce}
                        disabled={reinforcing}
                        className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 disabled:opacity-50 transition text-sm font-medium"
                      >
                        <RefreshCw className={`w-4 h-4 ${reinforcing ? 'animate-spin' : ''}`} />
                        {reinforcing ? 'Generating…' : 'Generate targeted practice'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-800 text-sm">
                    <CheckCircle className="w-5 h-5" />
                    All answered questions correct — great work!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* History / due list */}
        <div className="bg-white rounded-lg shadow no-print">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{isStudent ? 'My practice' : 'Practice plans'}</h2>
          </div>
          {history.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              {isStudent ? 'No practice assigned yet.' : 'No worksheets generated yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {history.map((w) => {
                const status = dueStatus(w);
                return (
                  <li
                    key={w._id}
                    onClick={() => openWorksheet(w._id)}
                    className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-navy-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {w.topic || 'Math worksheet'}
                          {!isStudent && w.studentName ? ` — ${w.studentName}` : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {w.sessionsCompleted || 0}/{w.sessionsTotal || 0} sessions
                          {w.nextDueAt ? ` · next ${new Date(w.nextDueAt).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                      {!isStudent && (
                        <button
                          onClick={(e) => deleteWorksheet(w._id, e)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          aria-label="Delete worksheet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Mistakes review */}
        <div className="bg-white rounded-lg shadow no-print">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isStudent ? 'My mistakes to review' : 'Mistakes to review'}
            </h2>
          </div>
          {mistakes.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No mistakes recorded yet — anything answered incorrectly shows here for review.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {mistakes.slice(0, 50).map((m, i) => (
                <li key={i} className="px-6 py-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900">{m.prompt}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {m.topic ? `${m.topic} · ` : ''}
                        {!isStudent && m.studentName ? `${m.studentName} · ` : ''}
                        {m.studentResponse ? `wrote: ${m.studentResponse} · ` : ''}
                        correct: {m.answer}
                      </p>
                      {m.feedback && <p className="text-xs text-gray-600 mt-1">{m.feedback}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
