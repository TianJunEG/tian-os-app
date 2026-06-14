import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getMascot } from '../../../config/mascots';

import sgP4Fractions from '../../../config/cheatsheets/sg-p4-fractions';
import sgP4WholeNumbers from '../../../config/cheatsheets/sg-p4-whole-numbers';
import sgP4FactorsMultiples from '../../../config/cheatsheets/sg-p4-factors-multiples';
import sgP4FourOperations from '../../../config/cheatsheets/sg-p4-four-operations';
import sgP4Decimals from '../../../config/cheatsheets/sg-p4-decimals';
import sgP4WordProblems from '../../../config/cheatsheets/sg-p4-word-problems';
import sgP4Statistics from '../../../config/cheatsheets/sg-p4-statistics';

const SHEETS = {
  'sg-p4-fr': sgP4Fractions,
  'sg-p4-wn': sgP4WholeNumbers,
  'sg-p4-fm': sgP4FactorsMultiples,
  'sg-p4-fo': sgP4FourOperations,
  'sg-p4-dec': sgP4Decimals,
  'sg-p4-wp': sgP4WordProblems,
  'sg-p4-stat': sgP4Statistics,
};

export default function CheatSheet() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const sheetRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const sheet = SHEETS[sheetId];
  if (!sheet) return <p className="p-6 text-ink-500">Cheat sheet not found.</p>;

  const mascot = getMascot(sheet.mascot);
  const color = mascot?.color || '#1e3a5f';

  const handleDownloadPDF = async () => {
    if (!sheetRef.current || exporting) return;
    setExporting(true);
    try {
      const el = sheetRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#111',
        windowWidth: 720,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${sheet.topic}-CheatSheet-${sheet.level.replace(/\s/g, '')}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl pb-12">
      {/* Nav bar */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-navy-700">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Exporting…' : 'Download PDF'}
        </button>
      </div>

      {/* Comic sheet */}
      <div ref={sheetRef} className="overflow-hidden rounded-lg border-4 border-black bg-black">
        {/* Masthead */}
        <div className="comic-masthead relative flex items-center gap-3 border-b-4 border-black px-4 py-3 sm:gap-4 sm:px-5">
          <div className="comic-halftone-overlay" />
          <img
            src={`/mascots/${sheet.mascot}-head.png`}
            alt={mascot?.name}
            className="relative z-10 h-12 w-12 rounded-full border-[3px] border-yellow-400 object-cover shadow-lg sm:h-14 sm:w-14"
            style={{ background: mascot?.colorLight || '#e2e8f0', boxShadow: `0 0 0 3px #000, 0 0 16px rgba(251,191,36,.4)` }}
          />
          <div className="relative z-10 min-w-0 flex-1">
            <h1 className="comic-title text-3xl leading-none sm:text-4xl">{sheet.topic.toUpperCase()}!</h1>
            <p className="comic-subtitle mt-0.5">{sheet.subtitle}</p>
          </div>
          <div className="comic-issue-badge relative z-10">
            {sheet.level.toUpperCase()}<br />ISSUE #{sheet.issue}
          </div>
        </div>

        {/* Panels grid */}
        <div className="grid grid-cols-1 gap-[3px] bg-black p-[3px] sm:grid-cols-2">
          {sheet.sections.map((sec, i) => (
            <SectionPanel
              key={i}
              section={sec}
              index={i}
              mascotKey={sheet.mascot}
              mascotColor={color}
              isWide={sec.bossLevel || i === sheet.sections.length - 1 && sheet.sections.length % 2 === 1}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="comic-footer">
          {mascot?.name?.toUpperCase()}'S CHEAT SHEET &bull; ISSUE #{sheet.issue}: {sheet.topic.toUpperCase()} &bull; TIAN OS &bull; TO BE CONTINUED…
        </div>
      </div>
    </div>
  );
}

function SectionPanel({ section, index, mascotKey, mascotColor, isWide }) {
  const panelNum = String(index + 1).padStart(2, '0');

  return (
    <div
      className={`comic-panel relative ${isWide ? 'sm:col-span-2' : ''} ${section.bossLevel ? 'comic-panel--boss' : ''}`}
    >
      <div className="comic-halftone-bg" />
      <span className="comic-panel-num" style={section.bossLevel ? { background: '#dc2626' } : {}}>
        {panelNum}
      </span>

      {section.bossLevel && (
        <div className="relative z-10 mb-1 px-3 pt-1">
          <span className="comic-boss-badge">BOSS LEVEL</span>
        </div>
      )}

      <div className="relative z-10 space-y-2.5 p-3 pt-6 sm:p-4 sm:pt-7">
        {/* Mascot + speech bubble */}
        <div className="flex items-start gap-2 sm:gap-3">
          <img
            src={`/mascots/${mascotKey}-head.png`}
            alt="mascot"
            className="h-10 w-10 shrink-0 rounded-full border-[3px] object-cover shadow-md sm:h-12 sm:w-12"
            style={{ borderColor: mascotColor, background: '#e2e8f0', boxShadow: '3px 3px 0 #000' }}
          />
          <div className="comic-speech-bubble flex-1 text-xs sm:text-sm">
            <span dangerouslySetInnerHTML={{ __html: highlightEmphasis(section.explanation) }} />
          </div>
        </div>

        {/* Formula card */}
        <div className="comic-formula-card">
          <p className="comic-formula-text">{section.formula}</p>
          <p className="comic-formula-note">{section.formulaNote}</p>
        </div>

        {/* Worked example */}
        <div className="comic-example">
          {section.example.steps.map((step, j) => (
            <p key={j} className="text-xs sm:text-sm">{step}</p>
          ))}
          <p className="comic-example-answer">
            = {section.example.answer}{' '}
            <span className="comic-sfx ml-1 text-base sm:text-lg">{section.sfx}</span>
          </p>
        </div>

        {/* Bar model (if present) */}
        {section.barModel && (
          <div className="flex items-center gap-2">
            <span className="comic-label">BAR MODEL:</span>
            <div className="comic-bar-model">
              {Array.from({ length: section.barModel.parts }).map((_, j) => (
                <div
                  key={j}
                  className={j < section.barModel.shaded ? 'comic-bar-on' : 'comic-bar-off'}
                >
                  {section.barModel.value}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pro tip */}
        {section.tip && (
          <div className="comic-tip">
            <span className="comic-tip-title">KYLO'S PRO TIP</span>
            <p>{section.tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function highlightEmphasis(text) {
  return text.replace(/\*([^*]+)\*/g, '<em class="comic-em">$1</em>');
}
