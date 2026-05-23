import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Upload,
  Sparkles,
  Printer,
  AlertCircle,
  Trash2,
  FileText,
  Loader
} from 'lucide-react';
import { worksheetsAPI } from '../services/api';
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

export default function WorksheetGeneratorPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [topicHint, setTopicHint] = useState('');
  const [numQuestions, setNumQuestions] = useState('8');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [worksheet, setWorksheet] = useState(null);
  const [teacherView, setTeacherView] = useState(true);

  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await worksheetsAPI.list();
      setHistory(res.data.worksheets || []);
    } catch (err) {
      console.error('Failed to load worksheet history:', err);
    }
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
      formData.append('numQuestions', numQuestions);

      const res = await worksheetsAPI.generate(formData);
      setWorksheet(res.data.worksheet);
      setTeacherView(true);
      loadHistory();
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
      setWorksheet(res.data.worksheet);
      setTeacherView(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not open that worksheet.');
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

  const hasQuestions = worksheet?.questions?.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40 no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                aria-label="Back to dashboard"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Math Worksheet Generator
                </h1>
                <p className="text-gray-600 text-sm">
                  Upload marked work → diagnose the misconception → practice questions
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Upload form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo of marked work <span className="text-red-500">*</span>
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 transition h-56 overflow-hidden">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade / level (optional)</label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="e.g. Year 5, Grade 7, Algebra I"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic hint (optional)</label>
                <input
                  type="text"
                  value={topicHint}
                  onChange={(e) => setTopicHint(e.target.value)}
                  placeholder="e.g. adding fractions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of questions</label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="5">5</option>
                  <option value="8">8</option>
                  <option value="10">10</option>
                  <option value="12">12</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate worksheet
              </>
            )}
          </button>
        </form>

        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center no-print">
            <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Reading the work and building practice questions…</p>
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
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={teacherView}
                  onChange={(e) => setTeacherView(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                Teacher view (show diagnosis &amp; answers)
              </label>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 sm:p-8 print-area">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {worksheet.topic || 'Math Practice Worksheet'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {worksheet.studentName ? `${worksheet.studentName} • ` : ''}
                  {worksheet.gradeLevel ? `${worksheet.gradeLevel} • ` : ''}
                  {new Date(worksheet.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>

              {/* Diagnosis (teacher view) */}
              {teacherView && (
                <div className="mb-6 space-y-4">
                  {worksheet.overallSummary && (
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900 mb-1">Diagnosis</h3>
                      <p className="text-gray-700 text-sm whitespace-pre-line">{worksheet.overallSummary}</p>
                    </div>
                  )}

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
                </div>
              )}

              {/* Questions */}
              {hasQuestions ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Practice questions</h3>
                  <ol className="space-y-5">
                    {worksheet.questions.map((q, i) => (
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

                            {teacherView ? (
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
                            ) : (
                              <div className="mt-3 border-b border-dashed border-gray-300 h-10" />
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-800 text-sm">
                    {worksheet.overallSummary ||
                      "No practice questions could be generated from this image. Try a clearer photo of the marked work."}
                  </p>
                </div>
              )}

              {teacherView && worksheet.sourceImageUrl && (
                <div className="mt-6 no-print">
                  <h3 className="font-semibold text-gray-900 mb-2">Original work</h3>
                  <img
                    src={`${FILE_BASE}${worksheet.sourceImageUrl}`}
                    alt="Original marked work"
                    className="max-h-80 rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white rounded-lg shadow no-print">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Past worksheets</h2>
          </div>
          {history.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No worksheets generated yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {history.map((w) => (
                <li
                  key={w._id}
                  onClick={() => openWorksheet(w._id)}
                  className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {w.topic || 'Math worksheet'}
                        {w.studentName ? ` — ${w.studentName}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteWorksheet(w._id, e)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    aria-label="Delete worksheet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
