import React, { useState, useMemo, useCallback } from 'react';
import { renderers } from '../mathpath/diagrams/svgRenderers';

import * as numbersGen from '../mathpath/primary/p1NumbersQuestionGenerator';
import * as addSubGen from '../mathpath/primary/p1AddSubQuestionGenerator';
import * as moneyGen from '../mathpath/primary/p1MoneyQuestionGenerator';
import * as measurementGen from '../mathpath/primary/p1MeasurementQuestionGenerator';
import * as geometryGen from '../mathpath/primary/p1GeometryQuestionGenerator';
import * as equalGroupsGen from '../mathpath/primary/p1EqualGroupsQuestionGenerator';
import * as dataGen from '../mathpath/primary/p1DataQuestionGenerator';

const domains = [
  { id: 'p1-numbers', label: 'Numbers', gen: numbersGen },
  { id: 'p1-addsub', label: 'Add/Sub', gen: addSubGen },
  { id: 'p1-money', label: 'Money', gen: moneyGen },
  { id: 'p1-measurement', label: 'Measurement', gen: measurementGen },
  { id: 'p1-geometry', label: 'Geometry', gen: geometryGen },
  { id: 'p1-equalgroups', label: 'Equal Groups', gen: equalGroupsGen },
  { id: 'p1-data', label: 'Data', gen: dataGen },
];

function renderDiagram(spec) {
  if (!spec) return null;
  const renderer = renderers[spec.type];
  if (!renderer) return <p style={{ color: '#999' }}>No renderer for type: {spec.type}</p>;
  const svg = renderer(spec);
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}

function QuestionCard({ q }) {
  const [showSolution, setShowSolution] = useState(false);
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{q.skillId} / {q.questionFamilyId}</div>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{q.prompt}</div>
      {q.diagramSpec && (
        <div style={{ marginBottom: 8, maxWidth: 640 }}>
          {renderDiagram(q.diagramSpec)}
        </div>
      )}
      <div style={{ fontSize: 13 }}>
        <span style={{ color: '#16a34a', fontWeight: 600 }}>Answer: {String(q.answer)}</span>
        {q.options && <span style={{ marginLeft: 12, color: '#888' }}>Options: {q.options.join(', ')}</span>}
        {q.choices && <span style={{ marginLeft: 12, color: '#888' }}>Choices: {q.choices.join(', ')}</span>}
      </div>
      {q.misconceptionTraps && (
        <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>Traps: {q.misconceptionTraps.join(', ')}</div>
      )}
      <button
        onClick={() => setShowSolution(!showSolution)}
        style={{ marginTop: 8, fontSize: 12, background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}
      >
        {showSolution ? 'Hide' : 'Show'} solution
      </button>
      {showSolution && <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>{q.solutionText}</div>}
    </div>
  );
}

export default function DiagramDemo() {
  const [activeDomain, setActiveDomain] = useState(domains[0].id);
  const [seed, setSeed] = useState(0);

  const regenerate = useCallback(() => setSeed((s) => s + 1), []);

  const questions = useMemo(() => {
    void seed;
    const domain = domains.find((d) => d.id === activeDomain);
    if (!domain) return [];
    const skillIds = domain.gen.getSupportedSkillIds();
    const qs = [];
    for (const sid of skillIds) {
      for (let i = 0; i < 2; i++) {
        const q = domain.gen.generateQuestion(sid);
        if (q) qs.push(q);
      }
    }
    return qs;
  }, [activeDomain, seed]);

  const diagramCount = questions.filter((q) => q.diagramSpec).length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>P1 Diagram Preview</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
        {questions.length} questions, {diagramCount} with diagrams
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {domains.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDomain(d.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: activeDomain === d.id ? '2px solid #2563eb' : '1px solid #ccc',
              background: activeDomain === d.id ? '#eff6ff' : '#fff',
              fontWeight: activeDomain === d.id ? 600 : 400,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {d.label}
          </button>
        ))}
        <button
          onClick={regenerate}
          style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #16a34a', color: '#16a34a', background: '#fff', cursor: 'pointer', fontSize: 13 }}
        >
          Regenerate
        </button>
      </div>

      {questions.map((q, i) => (
        <QuestionCard key={`${q.questionId}-${i}`} q={q} />
      ))}
    </div>
  );
}
