import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { familyAPI, mathpathAPI } from '../../services/api';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui';
import SuccessCentreDashboard from '../../components/mathpath/SuccessCentreDashboard';

export default function ParentSuccessCentre() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingCentre, setLoadingCentre] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const activeId = params.get('child') || params.get('studentId') || '';

  useEffect(() => {
    let mounted = true;
    familyAPI.children()
      .then((res) => {
        if (!mounted) return;
        const list = res.data.children || [];
        setChildren(list);
        if (!activeId && list[0]) setParams({ child: String(list[0].studentId) }, { replace: true });
      })
      .catch(() => setChildren([]))
      .finally(() => {
        if (mounted) setLoadingChildren(false);
      });
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loadingChildren || !children.length || !activeId) return;
    const allowed = children.some((item) => String(item.studentId) === String(activeId));
    if (!allowed) {
      setPayload(null);
      setError('');
      setParams({ child: String(children[0].studentId) }, { replace: true });
    }
  }, [activeId, children, loadingChildren, setParams]);

  useEffect(() => {
    if (!activeId) return;
    let mounted = true;
    setLoadingCentre(true);
    setPayload(null);
    setError('');
    mathpathAPI.parentSuccessCentre({ studentId: activeId })
      .then((res) => {
        if (mounted) setPayload(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.error || 'Could not load Success Centre.');
      })
      .finally(() => {
        if (mounted) setLoadingCentre(false);
      });
    return () => { mounted = false; };
  }, [activeId]);

  const child = useMemo(
    () => children.find((item) => String(item.studentId) === String(activeId)) || children[0],
    [children, activeId]
  );

  const handleAction = (item) => {
    if (!child?.studentId) return;
    if (item.type === 'review_uploaded_paper' && item.paperAnalysisId) {
      navigate(`/parent/children/${child.studentId}/mathpath/analyse-paper?analysis=${item.paperAnalysisId}`);
      return;
    }
    if (item.type === 'complete_recovery_pack' || item.type === 'run_recheck') {
      navigate(`/parent/children/${child.studentId}/mathpath`);
      return;
    }
    if (item.type === 'assign_recovery_pack') {
      navigate(`/parent/children/${child.studentId}/mathpath`);
      return;
    }
    navigate(`/parent/children/${child.studentId}/actions`);
  };

  if (loadingChildren) return <Spinner label="Loading Success Centre..." />;
  if (!children.length) {
    return <EmptyState icon={Users} message="No children linked yet. Once a child is added, their Success Centre appears here." />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Parent Success Centre"
        subtitle="Problem, intervention, improvement, and next action in one place."
        action={children.length > 1 ? (
          <select
            value={child?.studentId || ''}
            onChange={(event) => setParams({ child: event.target.value })}
            className="rounded-xl border border-hairline bg-paper px-3 py-2 text-sm font-semibold text-navy-700"
          >
            {children.map((item) => (
              <option key={item.studentId} value={item.studentId}>{item.name}</option>
            ))}
          </select>
        ) : null}
      />
      {error && <ErrorState message={error} />}
      {!error && loadingCentre && <Spinner label="Loading MathPath story..." />}
      {!error && !loadingCentre && payload && (
        <SuccessCentreDashboard data={payload} onAction={handleAction} />
      )}
    </div>
  );
}
