import React from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Badge } from '../ui';

function formatTime(value) {
  if (!value) return 'Saved just now';
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return 'Saved';
  }
}

export default function WorkingAttachmentPreview({
  evidence = null,
  onEdit,
  onDelete,
  onAddAnother,
}) {
  if (!evidence?.workingImage) {
    return (
      <Card className="mt-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-700">Working attachment</p>
            <p className="mt-1 text-sm text-ink-500">No full-screen working saved yet.</p>
          </div>
          <Button size="s" icon={Plus} onClick={onAddAnother}>Open Working</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <img
          src={evidence.workingImage}
          alt="Saved working preview"
          className="h-28 w-full rounded-lg border border-hairline bg-white object-contain sm:w-40"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink-700">Saved working</p>
            <Badge tone="success">{formatTime(evidence.workingSubmittedAt)}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">This working will be submitted with your typed answer.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="s" variant="secondary" icon={Edit3} onClick={onEdit}>Edit working</Button>
            <Button size="s" variant="secondary" icon={Trash2} onClick={onDelete}>Delete</Button>
            <Button size="s" variant="ghost" icon={Plus} onClick={onAddAnother}>Add another</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
