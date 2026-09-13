import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, FileUp, Loader2, X } from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import { mathpathAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../../design-os/studentVisualMode';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

function resizeImage(file, maxWidth = 1600) {
  return new Promise((resolve) => {
    if (file.type === 'application/pdf') { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= maxWidth) { resolve(file); return; }
      const scale = maxWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function UploadPaperPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const visualMode = resolveStudentVisualMode(user || {});
  const vs = getVisualModeStyles(visualMode);
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function handleFileSelect(e) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const invalid = selected.find((f) => !ACCEPTED_TYPES.includes(f.type));
    if (invalid) {
      setError('Please upload photos (JPG, PNG) or PDFs only.');
      return;
    }
    const tooBig = selected.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setError(`"${tooBig.name}" is too large (max 15 MB per file).`);
      return;
    }

    setError('');
    setFiles((prev) => [...prev, ...selected]);
    const newPreviews = selected.map((f) =>
      f.type.startsWith('image/') ? URL.createObjectURL(f) : null
    );
    setPreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(idx) {
    if (previews[idx]) URL.revokeObjectURL(previews[idx]);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUpload() {
    if (!files.length) return;
    setUploading(true);
    setError('');
    setUploadedCount(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const resized = await resizeImage(files[i]);
        const formData = new FormData();
        formData.append('paper', resized);
        formData.append('uploadType', 'marked_script');
        formData.append('domainId', 'fractions');
        await mathpathAPI.studentUploadPaper(formData);
        setUploadedCount(i + 1);
      }
      setPreviews((prev) => { prev.forEach((p) => p && URL.revokeObjectURL(p)); return []; });
      setFiles([]);
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  if (done) {
    return (
      <div className={`min-h-screen px-4 py-8 ${vs.shell}`}>
        <div className="mx-auto max-w-md">
          <Card className={`p-6 text-center ${vs.card}`}>
            <CheckCircle className="mx-auto mb-3 h-16 w-16 text-emerald-500" />
            <h2 className={`mb-2 text-xl font-bold ${vs.title}`}>Paper uploaded!</h2>
            <p className={`mb-4 text-sm ${vs.muted}`}>
              We&apos;ll analyse your paper and create practice questions based on your mistakes.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setDone(false)} className={vs.secondaryCta}>
                Upload another paper
              </Button>
              <Button onClick={() => navigate('/student/mathpath')} className={vs.primaryCta}>
                Back to MathPath
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 py-8 ${vs.shell}`}>
      <div className="mx-auto max-w-md">
        <h1 className={`mb-2 text-center text-2xl font-bold ${vs.title}`}>
          {vs.decorative ? '📄 Upload Your Test Paper' : 'Upload Test Paper'}
        </h1>
        <p className={`mb-6 text-center text-sm ${vs.muted}`}>
          Take photos of each page of your marked test and we&apos;ll help you practise what you got wrong!
        </p>

        <Card className={`p-5 ${vs.card}`}>
          {/* File picker — always visible so you can add more pages */}
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-6 transition hover:border-sky-400 hover:bg-sky-50">
            <div className={`rounded-full p-3 ${vs.icon}`}>
              <Camera className="h-7 w-7" />
            </div>
            <span className={`text-sm font-semibold ${vs.title}`}>
              {files.length === 0 ? 'Tap to take a photo or choose files' : 'Add more pages'}
            </span>
            <span className={`text-xs ${vs.muted}`}>JPG, PNG or PDF · multiple pages OK</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {/* Selected files list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className={`text-xs font-semibold ${vs.muted}`}>
                {files.length} page{files.length > 1 ? 's' : ''} selected
              </p>
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border bg-surface-raised p-2">
                  {previews[idx] ? (
                    <img
                      src={previews[idx]}
                      alt={`Page ${idx + 1}`}
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-sky-100">
                      <FileUp className="h-5 w-5 text-sky-500" />
                    </div>
                  )}
                  <span className="flex-1 truncate text-sm font-medium">
                    {uploading && idx < uploadedCount
                      ? `✓ Page ${idx + 1}`
                      : uploading && idx === uploadedCount
                        ? `Uploading page ${idx + 1}…`
                        : `Page ${idx + 1}`}
                  </span>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="shrink-0 text-red-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className={`mt-4 w-full ${vs.primaryCta}`}
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading {uploadedCount}/{files.length}…</>
              ) : (
                <><FileUp className="mr-2 h-4 w-4" /> Upload {files.length} page{files.length > 1 ? 's' : ''}</>
              )}
            </Button>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </Card>

        <p className={`mt-4 text-center text-xs ${vs.muted}`}>
          Your paper is private and only shared with your teacher or parent.
        </p>
      </div>
    </div>
  );
}
