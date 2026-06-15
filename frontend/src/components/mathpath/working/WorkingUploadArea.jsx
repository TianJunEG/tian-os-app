import React, { useRef, useState } from 'react';
import { Upload, Camera, FileText } from 'lucide-react';
import { Card, Button } from '../../ui';

export default function WorkingUploadArea({ files = [], onFilesAdded }) {
  const pickerRef = useRef(null);
  const cameraRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming) => {
    const next = Array.from(incoming || []);
    if (!next.length) return;
    onFilesAdded?.(next);
  };

  return (
    <Card
      className={`p-4 transition ${dragging ? 'border-emerald bg-emerald-tint' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer?.files);
      }}
    >
      <div className="text-center">
        <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-emerald-tint text-emerald-deep">
          <Upload className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-ink-700">Drag and drop pages here</p>
        <p className="mt-1 text-xs text-ink-500">Images or PDF, multiple pages supported.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button variant="secondary" onClick={() => pickerRef.current?.click()}>
          <FileText className="h-4 w-4" /> Choose Files
        </Button>
        <Button variant="secondary" onClick={() => cameraRef.current?.click()}>
          <Camera className="h-4 w-4" /> Camera
        </Button>
        <Button variant="ghost" disabled>
          Stylus Upload (Coming Soon)
        </Button>
      </div>

      <input
        ref={pickerRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*,.pdf,application/pdf"
        onChange={(e) => addFiles(e.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*"
        capture="environment"
        onChange={(e) => addFiles(e.target.files)}
      />

      {files.length > 0 && (
        <p className="mt-3 text-xs text-ink-500">{files.length} file(s) selected.</p>
      )}
    </Card>
  );
}

