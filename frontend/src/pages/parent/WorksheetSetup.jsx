import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Wand2 } from 'lucide-react';
import { worksheetGenAPI, skillsAPI } from '../../services/api';
import { Card, Button, PageHeader } from '../../components/ui';

// Parent › Worksheet Generator › setup. Mode, optional skill, count, difficulty, toggles.
export default function WorksheetSetup() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [mode, setMode] = useState(sp.get('mode') || 'weak_skills');
  const [skills, setSkills] = useState([]);
  const [skillId, setSkillId] = useState('');
  const [questionCount, setQuestionCount] = useState('10');
  const [difficulty, setDifficulty] = useState('medium');
  const [includesSolutions, setIncludesSolutions] = useState(true);
  const [includesMistakeReview, setIncludesMistakeReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { skillsAPI.list({ studentId }).then((r) => setSkills(r.data.skills || [])).catch(() => {}); }, [studentId]);

  const generate = async () => {
    setBusy(true); setError('');
    try {
      const body = { studentId, mode, difficulty, questionCount: Number(questionCount), includesSolutions, includesMistakeReview };
      if (mode === 'selected_topic' && skillId) body.skillIds = [skillId];
      const { data } = await worksheetGenAPI.generate(body);
      navigate(`/parent/children/${studentId}/worksheets/${data.worksheet.id}`);
    } catch (e) { setError(e.response?.data?.error || 'Could not generate worksheet.'); setBusy(false); }
  };

  return (
    <>
      <PageHeader title="New worksheet" subtitle="Math · choose what to practise" />
      {error && <Card className="mb-4 border-l-4 border-l-error-500 p-4 text-sm text-error-700">{error}</Card>}

      <div className="space-y-4">
        <Field label="Generate from">
          <Segmented value={mode} onChange={setMode} options={[{ v: 'recent_mistakes', l: 'Recent mistakes' }, { v: 'weak_skills', l: 'Weak skills' }, { v: 'selected_topic', l: 'A topic' }]} />
        </Field>

        {mode === 'selected_topic' && (
          <Field label="Topic / skill">
            <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="h-12 w-full rounded-xl border border-hairline bg-paper px-3 text-ink-800">
              <option value="">Choose a skill…</option>
              {skills.map((s) => <option key={s.skillId} value={s.skillId}>{s.topicName} · {s.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="Number of questions">
          <Segmented value={questionCount} onChange={setQuestionCount} options={[{ v: '6', l: '6' }, { v: '10', l: '10' }, { v: '15', l: '15' }]} />
        </Field>
        <Field label="Difficulty">
          <Segmented value={difficulty} onChange={setDifficulty} options={[{ v: 'easy', l: 'Easier' }, { v: 'medium', l: 'On level' }, { v: 'hard', l: 'Harder' }]} />
        </Field>

        <Toggle label="Include worked solutions" checked={includesSolutions} onChange={setIncludesSolutions} />
        <Toggle label="Include a mistake-review section" checked={includesMistakeReview} onChange={setIncludesMistakeReview} />

        <Button icon={Wand2} disabled={busy || (mode === 'selected_topic' && !skillId)} onClick={generate} className="w-full" size="l">
          {busy ? 'Generating…' : 'Generate worksheet'}
        </Button>
      </div>
    </>
  );
}

const Field = ({ label, children }) => (
  <div><div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</div>{children}</div>
);
const Segmented = ({ value, onChange, options }) => (
  <div className="flex gap-2">
    {options.map((o) => (
      <button key={o.v} onClick={() => onChange(o.v)} className={`h-11 flex-1 rounded-xl border text-sm font-semibold transition ${value === o.v ? 'border-navy-700 bg-navy-700 text-paper' : 'border-hairline bg-paper text-navy-700'}`}>{o.l}</button>
    ))}
  </div>
);
const Toggle = ({ label, checked, onChange }) => (
  <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between rounded-xl border border-hairline bg-paper px-4 py-3">
    <span className="text-sm text-ink-800">{label}</span>
    <span className={`h-6 w-11 rounded-full p-0.5 transition ${checked ? 'bg-navy-700' : 'bg-ink-100'}`}><span className={`block h-5 w-5 rounded-full bg-paper transition ${checked ? 'translate-x-5' : ''}`} /></span>
  </button>
);
