import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Upload, BookOpen, Loader2, Save, FileText } from 'lucide-react';
import SpellingHeader from '../../components/spelling/SpellingHeader';
import { spellingAPI } from '../../services/api';
import { lookupWord, bestDefinition, bestExample } from '../../services/dictionary';

const LEVELS = [
  ['P1', 'Primary 1'], ['P2', 'Primary 2'], ['P3', 'Primary 3'],
  ['P4', 'Primary 4'], ['P5', 'Primary 5'], ['P6', 'Primary 6'], ['other', 'Other']
];

const emptyRow = () => ({ word: '', sentence: '', definition: '' });

export default function SpellingEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const fileRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('other');
  const [isShared, setIsShared] = useState(false);
  const [words, setWords] = useState([emptyRow()]);
  const [sourceType, setSourceType] = useState('manual');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lookupIdx, setLookupIdx] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    spellingAPI
      .getList(id)
      .then((r) => {
        const l = r.data.list;
        setTitle(l.title);
        setDescription(l.description || '');
        setLevel(l.level || 'other');
        setIsShared(!!l.isShared);
        setWords(l.words.length ? l.words.map((w) => ({ word: w.word, sentence: w.sentence || '', definition: w.definition || '' })) : [emptyRow()]);
        setSourceType(l.sourceType || 'manual');
      })
      .catch(() => setError('Could not load this list.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (searchParams.get('upload') === '1') {
      setTimeout(() => fileRef.current?.click(), 300);
    }
  }, [searchParams]);

  const updateRow = (i, field, value) =>
    setWords((ws) => ws.map((w, idx) => (idx === i ? { ...w, [field]: value } : w)));
  const addRow = () => setWords((ws) => [...ws, emptyRow()]);
  const removeRow = (i) => setWords((ws) => (ws.length === 1 ? [emptyRow()] : ws.filter((_, idx) => idx !== i)));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setNotice('');
    setError('');
    try {
      const data = await spellingAPI.extractFile(file);
      const extracted = (data.words || []).map((w) => ({ word: w.word || '', sentence: w.sentence || '', definition: w.definition || '' }));
      if (extracted.length) {
        // Replace empty starter rows, otherwise append.
        setWords((ws) => {
          const existing = ws.filter((w) => w.word.trim());
          return [...existing, ...extracted];
        });
        if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
      }
      setSourceType(data.sourceType || 'manual');
      setNotice(
        data.warning ||
          (extracted.length ? `Added ${extracted.length} word(s) from ${data.fileName}. Please review and edit below.` : 'No words found — please type them below.')
      );
    } catch (err) {
      setError(err.message || 'Upload failed. Please try a different file or type the words.');
    } finally {
      setUploading(false);
    }
  };

  const lookup = async (i) => {
    const term = words[i].word.trim();
    if (!term) return;
    setLookupIdx(i);
    try {
      const result = await lookupWord(term);
      const def = bestDefinition(result);
      const example = bestExample(result);
      setWords((ws) =>
        ws.map((w, idx) =>
          idx === i
            ? { ...w, definition: def || w.definition, sentence: w.sentence || example }
            : w
        )
      );
    } catch {
      setNotice(`No dictionary entry found for "${term}".`);
    } finally {
      setLookupIdx(null);
    }
  };

  const save = async () => {
    setError('');
    const cleanWords = words.filter((w) => w.word.trim());
    if (!title.trim()) return setError('Please give the list a title.');
    if (cleanWords.length === 0) return setError('Please add at least one word.');

    setSaving(true);
    try {
      const payload = { title: title.trim(), description, level, isShared, sourceType, words: cleanWords };
      const res = isEdit ? await spellingAPI.updateList(id, payload) : await spellingAPI.createList(payload);
      navigate(`/spelling/lists/${res.data.list._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the list.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SpellingHeader title="Loading…" />
        <p className="text-center text-gray-500 py-16">Loading list…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader
        title={isEdit ? 'Edit list' : 'New spelling list'}
        backTo={isEdit ? `/spelling/lists/${id}` : '/spelling/lists'}
      />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        {notice && <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">{notice}</div>}

        {/* List meta */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">List title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 5 spelling"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-purple-500 outline-none"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-purple-500 outline-none bg-white">
                {LEVELS.map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} className="rounded text-purple-600 w-4 h-4" />
                Share to the library ({level === 'other' ? 'set a level for others to find it' : 'visible to everyone'})
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short note about this list"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Upload */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-800">Import from a file or photo</p>
                <p className="text-sm text-gray-500">PDF, Word (.docx), image or text. Underlined words in Word docs become the tested word.</p>
              </div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Reading…' : 'Choose file'}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.csv,image/*" onChange={handleUpload} className="hidden" />
          </div>
        </div>

        {/* Words */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Words ({words.filter((w) => w.word.trim()).length})</h2>
            <button onClick={addRow} className="text-sm text-purple-600 hover:underline inline-flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add word
            </button>
          </div>
          <div className="space-y-4">
            {words.map((w, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                  <input
                    value={w.word}
                    onChange={(e) => updateRow(i, 'word', e.target.value)}
                    placeholder="word"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-purple-500 outline-none font-medium"
                  />
                  <button
                    onClick={() => lookup(i)}
                    disabled={!w.word.trim() || lookupIdx === i}
                    title="Look up definition"
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-40"
                  >
                    {lookupIdx === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  </button>
                  <button onClick={() => removeRow(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={w.sentence}
                  onChange={(e) => updateRow(i, 'sentence', e.target.value)}
                  placeholder="Example sentence (optional) — used for the read-aloud test"
                  className="w-full p-2 mb-2 text-sm border border-gray-200 rounded-lg focus:border-purple-400 outline-none"
                />
                <input
                  value={w.definition}
                  onChange={(e) => updateRow(i, 'definition', e.target.value)}
                  placeholder="Meaning (optional) — type your own or use the dictionary button"
                  className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:border-purple-400 outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium inline-flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isEdit ? 'Save changes' : 'Create list'}
        </button>
      </main>
    </div>
  );
}
