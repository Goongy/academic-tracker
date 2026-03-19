import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Course } from '../../types';

interface CourseModalProps {
  course?: Course;
  onClose: () => void;
}

const COLORS = [
  { name: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { name: 'violet', label: 'Violet', bg: 'bg-violet-500' },
  { name: 'sky', label: 'Sky', bg: 'bg-sky-500' },
  { name: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
  { name: 'amber', label: 'Amber', bg: 'bg-amber-500' },
  { name: 'rose', label: 'Rose', bg: 'bg-rose-500' },
  { name: 'cyan', label: 'Cyan', bg: 'bg-cyan-500' },
  { name: 'orange', label: 'Orange', bg: 'bg-orange-500' },
];

export default function CourseModal({ course, onClose }: CourseModalProps) {
  const { state, addCourse, updateCourse } = useApp();
  const isEdit = !!course;

  // Get unique term names
  const termNames = Array.from(new Set(state.terms.map(t => t.name)));
  const activeTerm = state.terms.find(t => t.id === state.settings.activeTermId);

  const [name, setName] = useState(course?.name ?? '');
  const [code, setCode] = useState(course?.code ?? '');
  const [term, setTerm] = useState(course?.term ?? activeTerm?.name ?? '');
  const [customTerm, setCustomTerm] = useState('');
  const [useCustomTerm, setUseCustomTerm] = useState(false);
  const [creditHours, setCreditHours] = useState(String(course?.creditHours ?? 3));
  const [targetGrade, setTargetGrade] = useState(
    course?.targetGrade != null ? String(course.targetGrade) : ''
  );
  const [finalGradeOverride, setFinalGradeOverride] = useState(
    course?.finalGradeOverride != null ? String(course.finalGradeOverride) : ''
  );
  const [color, setColor] = useState(course?.color ?? 'indigo');
  const [isPassFail, setIsPassFail] = useState(course?.isPassFail ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Course name is required.';
    if (!code.trim()) newErrors.code = 'Course code is required.';
    const ch = Number(creditHours);
    if (isNaN(ch) || ch < 0 || ch > 6) newErrors.creditHours = 'Credit hours must be 0–6.';
    if (targetGrade !== '') {
      const tg = Number(targetGrade);
      if (isNaN(tg) || tg < 0 || tg > 100) newErrors.targetGrade = 'Target must be 0–100.';
    }
    if (finalGradeOverride !== '') {
      const fg = Number(finalGradeOverride);
      if (isNaN(fg) || fg < 0 || fg > 100)
        newErrors.finalGradeOverride = 'Override must be 0–100.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const termName = useCustomTerm ? customTerm.trim() : term;
    const payload: Omit<Course, 'id'> = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      term: termName,
      creditHours: Number(creditHours),
      targetGrade: targetGrade !== '' ? Number(targetGrade) : null,
      finalGradeOverride: finalGradeOverride !== '' ? Number(finalGradeOverride) : null,
      color,
      isPassFail,
    };

    if (isEdit && course) {
      updateCourse({ ...payload, id: course.id });
    } else {
      addCourse(payload);
      // Add new term if it doesn't exist
      if (!state.terms.find(t => t.name === termName)) {
        // addTerm(termName);
      }
    }
    onClose();
  }

  const inputClass =
    'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400';

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Course' : 'Add Course'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Course Name */}
          <div>
            <label className={labelClass}>Course Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Data Structures"
              className={inputClass}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Course Code */}
          <div>
            <label className={labelClass}>Course Code *</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. CS 301"
              className={inputClass}
            />
            {errors.code && (
              <p className="text-xs text-red-500 mt-1">{errors.code}</p>
            )}
          </div>

          {/* Term */}
          <div>
            <label className={labelClass}>Term</label>
            {!useCustomTerm ? (
              <div className="flex gap-2">
                <select
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  className={`${inputClass} flex-1`}
                >
                  {termNames.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setUseCustomTerm(true)}
                  className="px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  New
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTerm}
                  onChange={e => setCustomTerm(e.target.value)}
                  placeholder="e.g. Fall 2025"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => setUseCustomTerm(false)}
                  className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Credit Hours */}
          <div>
            <label className={labelClass}>Credit Hours</label>
            <input
              type="number"
              value={creditHours}
              onChange={e => setCreditHours(e.target.value)}
              min={0}
              max={6}
              step={1}
              className={inputClass}
            />
            {errors.creditHours && (
              <p className="text-xs text-red-500 mt-1">{errors.creditHours}</p>
            )}
          </div>

          {/* Target Grade */}
          <div>
            <label className={labelClass}>Target Grade % (optional)</label>
            <input
              type="number"
              value={targetGrade}
              onChange={e => setTargetGrade(e.target.value)}
              min={0}
              max={100}
              placeholder="e.g. 90"
              className={inputClass}
            />
            {errors.targetGrade && (
              <p className="text-xs text-red-500 mt-1">{errors.targetGrade}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className={labelClass}>Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`w-8 h-8 rounded-full ${c.bg} ring-offset-2 dark:ring-offset-gray-800 transition-all ${
                    color === c.name ? 'ring-2 ring-gray-700 dark:ring-gray-300 scale-110' : 'hover:scale-105'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Pass/Fail Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pass / Fail Course
            </label>
            <button
              type="button"
              onClick={() => setIsPassFail(!isPassFail)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPassFail ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isPassFail ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Final Grade Override */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <label className={labelClass}>
              Final Grade Override % (optional)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Manually set the final grade for completed courses.
            </p>
            <input
              type="number"
              value={finalGradeOverride}
              onChange={e => setFinalGradeOverride(e.target.value)}
              min={0}
              max={100}
              placeholder="e.g. 88"
              className={inputClass}
            />
            {errors.finalGradeOverride && (
              <p className="text-xs text-red-500 mt-1">{errors.finalGradeOverride}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {isEdit ? 'Save Changes' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
