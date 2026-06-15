import React from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import FractionsStoryModeSession from './FractionsStoryModeSession';

export default function StoryModeDomainRoute() {
  const { domain } = useParams();
  const normalizedDomain = String(domain || '').toLowerCase();

  if (normalizedDomain === 'fractions') {
    return <FractionsStoryModeSession />;
  }

  return (
    <div className="mx-auto max-w-xl px-3 pt-3 sm:px-0">
      <Card className="p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-tint text-emerald-deep">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-ink-900">Story Mode for this topic is coming soon</h2>
        <p className="mt-2 text-sm text-ink-600">
          Fractions Story Mode is ready now. Other MathPath domains will get guided story missions later.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button to="/student/mathpath/fractions/story/F025">Start Fractions Story</Button>
          <Button to="/student/mathpath" variant="secondary">Back to MathPath</Button>
        </div>
      </Card>
    </div>
  );
}
