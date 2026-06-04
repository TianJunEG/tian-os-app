import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wand2 } from 'lucide-react';
import { worksheetGenAPI, skillsAPI, mathpathAPI } from '../../../services/api';
import { Button, Card, ErrorState, PageHeader, Select, Spinner } from '../../../components/ui';

export default function WorksheetSetup() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [mode, setMode] = useState(sp.get('mode') || 'weak_skills');
  const [skills, setSkills] = useState([]);
  const [skillId, setSkillId] = useState('');
  const [count, setCount] = useState('8');
  const [difficulty, setDifficulty] = useState('medium');
  const [mistakeTypes, setMistakeTypes] = useState([]);
  const [mistakeType, setMistakeType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, m] = await Promise.all([skillsAPI.list({ subject: 'math' }), mathpathAPI.mistakes()]);
      setSkills(s.data.skills || []);
      const tags = new Map();
      (m.data.mistakes || []).forEach((x) => {
        if (!x.misconceptionTag) return;
        const label = x.mistakeTypeLabel || x.misconceptionTag;
        tags.set(x.misconceptionTag, label);
      });
      setMistakeTypes([...tags.entries()].map(([value, label]) => ({ value, label })));
    } catch (_) {
      setError('Couldn’t load worksheet options.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const weakSkill = useMemo(() => {
    const attempted = skills.filter((s) => s.status && s.status !== 'not_started');
    if (!attempted.length) return skills[0] || null;
    return [...attempted].sort((a, b) => (a.score || 0) - (b.score || 0))[0];
  }, [skills]);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const body = {
        mode,
        subject: 'Math',
        questionCount: Number(count),
        difficulty,
        includesSolutions: true,
        includesMistakeReview: true,
      };
      if (mode === 'selected_topic') body.skillIds = [skillId];
      if (mode === 'weak_skills' && weakSkill?.skillId) body.skillIds = [weakSkill.skillId];
      if (mode === 'recent_mistakes' && mistakeType) body.misconceptionTag = mistakeType;
      const { data } = await worksheetGenAPI.generate(body);
      navigate(`/student/worksheets/${data.worksheet.id}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Couldn’t generate worksheet.');
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading worksheet options…" />;
  if (error && !skills.length) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader title="Choose Worksheet Scope" subtitle="Generate a short worksheet from weak skills, diagnostic results, selected skill, or mistake type." />
      {error && <Card className="mb-4 border-l-4 border-l-error-500 p-3 text-sm text-error-700">{error}</Card>}

      <div className="space-y-4">
        <Field label="Source">
          <Segmented value={mode} onChange={setMode} options={[
            { v: 'weak_skills', l: 'Weak skill' },
            { v: 'diagnostic_results', l: 'Diagnostic' },
            { v: 'selected_topic', l: 'Selected skill' },
            { v: 'recent_mistakes', l: 'Mistake type' },
          ]} />
        </Field>

        {mode === 'weak_skills' && (
          <Card className="p-3 text-sm text-ink-600">
            {weakSkill ? `Current weak skill: ${weakSkill.topicName} · ${weakSkill.name}` : 'No weak skill history yet; first skill in the catalog will be used.'}
          </Card>
        )}

        {mode === 'selected_topic' && (
          <Field label="Skill">
            <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
              <option value="">Choose a skill…</option>
              {skills.map((s) => (
                <option key={s.skillId} value={s.skillId}>{s.topicName} · {s.name}</option>
              ))}
            </Select>
          </Field>
        )}

        {mode === 'recent_mistakes' && (
          <Field label="Mistake Type (Optional)">
            <Select value={mistakeType} onChange={(e) => setMistakeType(e.target.value)}>
              <option value="">All recent mistake types</option>
              {mistakeTypes.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Questions">
          <Segmented value={count} onChange={setCount} options={[{ v: '5', l: '5' }, { v: '8', l: '8' }, { v: '10', l: '10' }]} />
        </Field>

        <Field label="Difficulty">
          <Segmented value={difficulty} onChange={setDifficulty} options={[{ v: 'easy', l: 'Easy' }, { v: 'medium', l: 'Medium' }, { v: 'hard', l: 'Hard' }]} />
        </Field>

        <Button
          size="l"
          icon={Wand2}
          onClick={create}
          disabled={busy || (mode === 'selected_topic' && !skillId)}
          className="w-full"
        >
          {busy ? 'Generating…' : 'Generate Worksheet'}
        </Button>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</div>
      {children}
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`h-11 rounded-xl border text-sm font-semibold transition ${value === o.v ? 'border-navy-700 bg-navy-700 text-paper' : 'border-hairline bg-paper text-navy-700'}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
