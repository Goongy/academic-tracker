import { useState, useRef } from 'react';
import {
  Moon,
  Sun,
  Download,
  Upload,
  Target,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  FileSearch,
  Sliders,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSeedData } from '../data/seedData';
import TranscriptUpload from './TranscriptUpload';
import { DALHOUSIE_GRADE_SCALE, type GradeScaleEntry } from '../types';

export default function SettingsView() {
  const { state, updateSettings, exportToJSON, exportToCSV, importFromJSON, dispatch, addTerm } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');
  const [targetGPAInput, setTargetGPAInput] = useState(String(state.settings.targetGPA));
  const [newTermName, setNewTermName] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editableScale, setEditableScale] = useState<GradeScaleEntry[]>(
    () => state.settings.gradeScale ? [...state.settings.gradeScale] : [...DALHOUSIE_GRADE_SCALE]
  );
  const [scaleSaveStatus, setScaleSaveStatus] = useState<'idle' | 'saved'>('idle');

  function handleTargetGPASave() {
    const val = parseFloat(targetGPAInput);
    if (!isNaN(val) && val >= 0 && val <= 4.0) {
      updateSettings({ targetGPA: val });
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importFromJSON(file);
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 4000);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleReset() {
    dispatch({ type: 'LOAD_DATA', payload: getSeedData() });
    setShowResetConfirm(false);
  }

  function handleClearAll() {
    dispatch({
      type: 'LOAD_DATA',
      payload: {
        courses: [],
        assignments: [],
        terms: [],
        settings: state.settings,
      },
    });
    setShowClearConfirm(false);
  }

  function handleAddTerm() {
    const name = newTermName.trim();
    if (!name) return;
    if (state.terms.find(t => t.name === name)) return;
    addTerm(name);
    setNewTermName('');
  }

  const inputClass =
    'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400';

  const sectionClass =
    'bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your preferences, terms, and data.
        </p>
      </div>

      {/* Appearance */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Toggle dark theme for the interface
            </p>
          </div>
          <button
            onClick={() => updateSettings({ darkMode: !state.settings.darkMode })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.settings.darkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                state.settings.darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {state.settings.darkMode ? (
            <><Moon className="w-3.5 h-3.5 text-indigo-500" /> Dark mode is on</>
          ) : (
            <><Sun className="w-3.5 h-3.5 text-amber-500" /> Light mode is on</>
          )}
        </div>
      </div>

      {/* GPA Target */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-500" />
          GPA Target
        </h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target GPA (0.0 – 4.0)
            </label>
            <input
              type="number"
              value={targetGPAInput}
              onChange={e => setTargetGPAInput(e.target.value)}
              min={0}
              max={4.0}
              step={0.1}
              className={inputClass}
            />
          </div>
          <button
            onClick={handleTargetGPASave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Save
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Current target: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{state.settings.targetGPA.toFixed(1)}</span>
        </p>
      </div>

      {/* Grade Scale */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-500" />
          Grade Scale
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Preloaded with Dalhousie University's official scale. Edit the minimum percentage or GPA points for any letter grade — all calculations update immediately after saving.
        </p>

        {/* Column headers */}
        <div className="flex items-center gap-2 px-3 mb-1">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-10">Grade</span>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex-1">Min %</span>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-20 text-right">GPA pts</span>
        </div>

        <div className="space-y-1.5">
          {editableScale.map((entry, i) => {
            const isLowest = i === editableScale.length - 1;
            return (
              <div
                key={entry.letter}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700"
              >
                {/* Letter grade — fixed label */}
                <span className="font-mono font-bold text-sm text-gray-800 dark:text-gray-200 w-10">
                  {entry.letter}
                </span>

                {/* Min % input */}
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">≥</span>
                  <input
                    type="number"
                    value={entry.minPercent}
                    onChange={e => {
                      const val = Math.min(100, Math.max(0, Number(e.target.value)));
                      setEditableScale(prev =>
                        prev.map((s, j) => j === i ? { ...s, minPercent: val } : s)
                      );
                    }}
                    min={0}
                    max={100}
                    step={1}
                    disabled={isLowest}
                    className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-center"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>

                {/* GPA points input */}
                <input
                  type="number"
                  value={entry.gpaPoints}
                  onChange={e => {
                    const val = Math.max(0, Number(parseFloat(e.target.value).toFixed(1)));
                    setEditableScale(prev =>
                      prev.map((s, j) => j === i ? { ...s, gpaPoints: val } : s)
                    );
                  }}
                  min={0}
                  max={5}
                  step={0.1}
                  className="w-20 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                />
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => {
              const fresh = [...DALHOUSIE_GRADE_SCALE];
              setEditableScale(fresh);
              updateSettings({ gradeScale: fresh });
              setScaleSaveStatus('saved');
              setTimeout(() => setScaleSaveStatus('idle'), 2000);
            }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
          >
            Reset to Dalhousie defaults
          </button>
          <button
            onClick={() => {
              updateSettings({ gradeScale: editableScale });
              setScaleSaveStatus('saved');
              setTimeout(() => setScaleSaveStatus('idle'), 2000);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {scaleSaveStatus === 'saved' ? (
              <><CheckCircle className="w-4 h-4" /> Saved</>
            ) : (
              'Save Scale'
            )}
          </button>
        </div>
      </div>

      {/* Terms Management */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Terms
        </h2>
        <div className="space-y-2 mb-4">
          {state.terms.map(term => (
            <div
              key={term.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700"
            >
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{term.name}</p>
                {state.settings.activeTermId === term.id && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">Active</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {state.settings.activeTermId !== term.id && (
                  <button
                    onClick={() => {
                      updateSettings({ activeTermId: term.id });
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Set Active
                  </button>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {state.courses.filter(c => c.term === term.name).length} courses
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTermName}
            onChange={e => setNewTermName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTerm()}
            placeholder="e.g. Fall 2025"
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={handleAddTerm}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Transcript Import */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
          <FileSearch className="w-4 h-4 text-indigo-500" />
          Import from Transcript
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Upload a PDF or photo of your university transcript and AI will automatically extract your courses and grades.
        </p>
        <TranscriptUpload />
      </div>

      {/* Data Export / Import */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Management
        </h2>

        {/* Import Status */}
        {importStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Data imported successfully!
          </div>
        )}
        {importStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {importError}
          </div>
        )}

        <div className="space-y-3">
          {/* Export JSON */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Export as JSON</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Full data backup, importable later</p>
            </div>
            <button
              onClick={exportToJSON}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          </div>

          {/* Export CSV */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Export as CSV</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Flat table, open in Excel/Sheets</p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          {/* Import JSON */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Import from JSON</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Restore from a previous export</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Summary
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {state.courses.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Courses</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {state.assignments.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Assignments</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {state.terms.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Terms</p>
          </div>
        </div>
      </div>

      {/* Reset to Seed Data */}
      <div className={`${sectionClass} border-red-100 dark:border-red-900/40`}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Reset Data
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Restore the app to its original demo data. This will erase all your courses and assignments.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Demo Data
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Yes, Reset Everything
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Clear All Data */}
      <div className={`${sectionClass} border-red-100 dark:border-red-900/40`}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Clear All Data
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Start completely fresh with no courses, assignments, or terms. Perfect for setting up your own data from scratch.
        </p>
        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Everything
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Yes, Delete Everything
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
