import React from 'react';
import { Construction } from 'lucide-react';
import { PageHeader, EmptyState, Button } from '../components/ui';

// Phase 1 placeholder for routes whose full screens land in later phases. Keeps
// navigation whole so the shell can be demoed end-to-end without dead links.
export default function Placeholder({ title, phase, home = '/student' }) {
  return (
    <>
      <PageHeader title={title} subtitle={phase ? `Planned for ${phase}.` : undefined} />
      <EmptyState icon={Construction} message={`This screen isn't built yet. It's specified in the Tian OS MVP plan and arrives in a later phase.`}>
        <Button to={home} variant="secondary" size="s">Back to dashboard</Button>
      </EmptyState>
    </>
  );
}
