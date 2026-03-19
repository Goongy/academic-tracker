import { FileSearch } from 'lucide-react';
import TranscriptUpload from './TranscriptUpload';

export default function ImportsView() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Imports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Import your academic data from external sources.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
          <FileSearch className="w-4 h-4 text-indigo-500" />
          Import from Transcript
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Upload a PDF or photo of your university transcript and AI will automatically extract your courses and grades.
        </p>
        <TranscriptUpload />
      </div>
    </div>
  );
}
