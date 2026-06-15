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

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  function handleFileSelect(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Please upload a photo (JPG, PNG) or PDF of your test paper.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('File is too large. Please use a smaller photo (under 15 MB).');
      return;
    }
    setError('');
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append('paper', resized);
      formData.append('uploadType', 'marked_script');
      formData.append('domainId', 'fractions');
      const res = await mathpathAPI.studentUploadPaper(formData);
      setSuccess(res.data);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div className={`min-h-screen px-4 py-8 ${vs.shell}`}>
        <div className="mx-auto max-w-md">
          <Card className={`p-6 text-center ${vs.card}`}>
            <CheckCircle className="mx-auto mb-3 h-16 w-16 text-emerald-500" />
            <h2 className={`mb-2 text-xl font-bold ${vs.title}`}>Paper uploaded!</h2>
            <p className={`mb-4 text-sm ${vs.muted}`}>
              {success.warning || 'We\'ll analyse your paper and create practice questions based on your mistakes.'}
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setSuccess(null)} className={vs.secondaryCta}>
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
          Take a photo of your marked test and we&apos;ll help you practise what you got wrong!
        </p>

        <Card className={`p-5 ${vs.card}`}>
          {!file ? (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-8 transition hover:border-sky-400 hover:bg-sky-50">
              <div className={`rounded-full p-4 ${vs.icon}`}>
                <Camera className="h-8 w-8" />
              </div>
              <span className={`text-sm font-semibold ${vs.title}`}>
                Tap to take a photo or choose a file
              </span>
              <span className={`text-xs ${vs.muted}`}>JPG, PNG or PDF</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          ) : (
            <div className="space-y-4">
              {preview && (
                <div className="relative overflow-hidden rounded-lg border">
                  <img src={preview} alt="Preview" className="w-full object-contain" style={{ maxHeight: 300 }} />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow hover:bg-red-50"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              )}
              {!preview && file && (
                <div className="flex items-center gap-3 rounded-lg border bg-surface-raised p-3">
                  <FileUp className="h-6 w-6 text-sky-500" />
                  <span className="flex-1 truncate text-sm font-medium">{file.name}</span>
                  <button type="button" onClick={clearFile} className="text-red-400 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className={`w-full ${vs.primaryCta}`}
              >
                {uploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  <><FileUp className="mr-2 h-4 w-4" /> Upload Paper</>
                )}
              </Button>
            </div>
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
