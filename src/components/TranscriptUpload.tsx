import { useState, useRef } from 'react';
import { FileText, FileImage, Loader2, CheckCircle, AlertCircle, GraduationCap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Course, Term } from '../types';

interface ParsedData {
  terms: Term[];
  courses: Course[];
  assignments: never[];
}

export default function TranscriptUpload() {
  const { state, dispatch } = useApp();
  const [status, setStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ newTerms: number; newCourses: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPDF && !isImage) {
      setError('Please upload a PDF or image (JPG, PNG, WEBP)');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
      return;
    }

    // Vercel's serverless function body limit is 4.5 MB.
    // Base64 adds ~33% overhead, so cap the source file at 3 MB.
    if (file.size > 3 * 1024 * 1024) {
      setError('File is too large. Please use a file under 3 MB (most transcripts are well under this).');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
      return;
    }

    setStatus('parsing');
    setError('');
    setResult(null);

    // Read file as base64 and send JSON — works in both local dev and Vercel
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]); // strip "data:...;base64," prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      const res = await fetch('/api/parse-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType: file.type }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const parsed: ParsedData = await res.json();

      // Merge: only add terms/courses that don't already exist
      const existingTermNames = new Set(state.terms.map(t => t.name));
      const existingCourseKeys = new Set(state.courses.map(c => `${c.code}|${c.term}`));

      const newTerms = parsed.terms.filter(t => !existingTermNames.has(t.name));
      const newCourses = parsed.courses.filter(c => !existingCourseKeys.has(`${c.code}|${c.term}`));

      for (const term of newTerms) {
        dispatch({ type: 'ADD_TERM', payload: term });
      }
      for (const course of newCourses) {
        dispatch({ type: 'ADD_COURSE', payload: course });
      }

      // If there's no active term, activate the most recent imported term
      const hasActiveTerm = state.terms.some(t => t.id === state.settings.activeTermId);
      if (!hasActiveTerm && newTerms.length > 0) {
        const lastTerm = newTerms[newTerms.length - 1];
        dispatch({ type: 'UPDATE_TERM', payload: { ...lastTerm, isActive: true } });
      }

      setResult({ newTerms: newTerms.length, newCourses: newCourses.length });
      setStatus('success');
      setTimeout(() => { setStatus('idle'); setResult(null); }, 6000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse transcript';
      const isNetworkError = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network');
      setError(
        isNetworkError
          ? 'Cannot reach the local server. Make sure you started the app with "npm run dev".'
          : msg
      );
      setStatus('error');
      setTimeout(() => setStatus('idle'), 6000);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && status !== 'parsing') processFile(file);
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => status !== 'parsing' && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          status === 'parsing'
            ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/10 cursor-wait'
            : isDragging
            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 cursor-copy'
            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={status === 'parsing'}
        />

        {status === 'parsing' ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reading transcript with AI…
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">This usually takes 10–30 seconds</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drop your transcript here, or{' '}
                <span className="text-indigo-600 dark:text-indigo-400">browse</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Supports PDF and images (JPG, PNG, WEBP) · up to 3 MB
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> PDF
              </span>
              <span className="flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5" /> Image
              </span>
            </div>
          </div>
        )}
      </div>

      {/* What gets imported */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-1">
        Extracts terms, course names, credit hours, and final grades. Existing courses are never overwritten.
      </p>

      {/* Status feedback */}
      {status === 'success' && result && (
        <div className="flex items-start gap-2 p-3 mt-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-700 dark:text-emerald-300">Transcript imported!</p>
            <p className="text-xs mt-0.5 text-emerald-600 dark:text-emerald-400">
              Added {result.newTerms} term{result.newTerms !== 1 ? 's' : ''} and{' '}
              {result.newCourses} course{result.newCourses !== 1 ? 's' : ''}.
              {result.newCourses === 0 && ' All courses already existed — nothing was duplicated.'}
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-medium text-red-700 dark:text-red-300">Import failed</p>
            <p className="text-xs mt-0.5 text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
