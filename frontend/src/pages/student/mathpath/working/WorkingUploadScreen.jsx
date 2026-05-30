import React, { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHeader, Button, ErrorState } from '../../../../components/ui';
import WorkingUploadCard from '../../../../components/mathpath/working/WorkingUploadCard';
import WorkingUploadArea from '../../../../components/mathpath/working/WorkingUploadArea';
import WorkingReviewCard from '../../../../components/mathpath/working/WorkingReviewCard';
import WorkingSubmissionSummary from '../../../../components/mathpath/working/WorkingSubmissionSummary';

function createFileItem(file) {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: file.type?.startsWith('image/') ? URL.createObjectURL(file) : '',
    type: file.type || '',
    size: file.size || 0,
  };
}

export default function WorkingUploadScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const replaceRef = useRef(null);
  const replaceTargetRef = useRef(null);

  const source = searchParams.get('source') || 'practice';
  const state = location.state || {};
  const sessionType = state.sessionType || (source === 'assessment' ? 'assessment' : 'practice');
  const questionRefs = state.questionRefs || [];
  const requiringWorkingCount = questionRefs.filter((q) => q.workingRequired).length;

  const [files, setFiles] = useState([]);
  const [noWorkingChecked, setNoWorkingChecked] = useState({});
  const [warning, setWarning] = useState('');

  const canContinue = files.length > 0 || Object.values(noWorkingChecked).some(Boolean);
  const missingWarning = useMemo(() => {
    if (!questionRefs.length) return '';
    const covered = files.length + Object.values(noWorkingChecked).filter(Boolean).length;
    return covered < requiringWorkingCount ? 'Some questions may be missing working.' : '';
  }, [files.length, noWorkingChecked, questionRefs.length, requiringWorkingCount]);

  const onFilesAdded = (incoming) => {
    const additions = incoming.map(createFileItem);
    setFiles((prev) => [...prev, ...additions]);
    setWarning('');
  };

  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const replaceFile = (id) => {
    replaceTargetRef.current = id;
    replaceRef.current?.click();
  };

  const onReplacePicked = (picked) => {
    const file = picked?.[0];
    if (!file || !replaceTargetRef.current) return;
    const nextItem = createFileItem(file);
    setFiles((prev) => prev.map((item) => {
      if (item.id !== replaceTargetRef.current) return item;
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return { ...nextItem, id: item.id };
    }));
    replaceTargetRef.current = null;
  };

  const onToggleNoWorking = (q, checked) => {
    if (!q?.questionId) return;
    const allowed = q.mentalMathEligible || !q.workingRequired;
    if (!allowed && checked) {
      setWarning('No-working-required is only allowed for mental-math or non-working questions.');
      return;
    }
    setWarning('');
    setNoWorkingChecked((prev) => ({ ...prev, [q.questionId]: checked }));
  };

  const goReview = () => {
    if (!canContinue) {
      setWarning('Please upload at least one page or mark no-working-required where appropriate.');
      return;
    }
    navigate('/student/mathpath/working/review', {
      state: {
        ...state,
        sessionType,
        files: files.map((f) => ({
          id: f.id,
          name: f.file.name,
          type: f.file.type,
          size: f.file.size,
          previewUrl: f.previewUrl,
        })),
        rawFiles: files.map((f) => f.file),
        noWorkingChecked,
        warning: missingWarning,
      },
    });
  };

  if (!state.workingSessionId && !state.practiceSessionId && !state.assessmentSessionId && source !== 'manual') {
    return <ErrorState message="Couldn't find a working session. Start from practice or assessment summary." onRetry={() => navigate('/student/mathpath')} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Upload Working" subtitle="Upload your working so MathPath can better understand your thinking." />
      <div className="space-y-4">
        <WorkingUploadCard
          sessionType={sessionType}
          questionCount={questionRefs.length || state.totalQuestions || 0}
          requiringWorkingCount={requiringWorkingCount}
          status="pending"
        />
        <WorkingUploadArea files={files} onFilesAdded={onFilesAdded} />
        <WorkingReviewCard items={files} onRemove={removeFile} onReplace={replaceFile} />
        <WorkingSubmissionSummary
          questionRefs={questionRefs}
          noWorkingChecked={noWorkingChecked}
          onToggleNoWorking={onToggleNoWorking}
          missingWarning={missingWarning}
        />
        {warning && <p className="text-sm text-error-700">{warning}</p>}
        <Button className="w-full" icon={ArrowRight} onClick={goReview}>Review and Submit</Button>
      </div>

      <input
        ref={replaceRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,application/pdf"
        onChange={(e) => onReplacePicked(e.target.files)}
      />
    </div>
  );
}
