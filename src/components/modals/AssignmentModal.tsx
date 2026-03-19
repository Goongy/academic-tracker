import { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Assignment, AssignmentCategory, AssignmentStatus } from '../../types';

interface AssignmentModalProps {
  courseId: string;
  assignment?: Assignment;
  onClose: () => void;
}

const CATEGORIES: { value: AssignmentCategory; label: string }[] = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
  { value: 'exam', label: 'Exam' },
  { value: 'lab', label: 'Lab' },
  { value: 'project', label: 'Project' },
  { value: 'participation', label: 'Participation' },
  { value: 'other', label: 'Other' },
];

const STATUSES: { value: AssignmentStatus; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'graded', label: 'Graded' },
  { value: 'missing', label: 'Missing' },
];

export default function AssignmentModal({
  courseId,
  assignment,
  onClose,
}: AssignmentModalProps) {
  const { state, addAssignment, updateAssignment } = useApp();
  const isEdit = !!assignment;

  const [name, setName] = useState(assignment?.name ?? '');
  const [category, setCategory] = useState<AssignmentCategory>(
    assignment?.category ?? 'assignment'
  );
  const [weight, setWeight] = useState(String(assignment?.weight ?? ''));
  const [dueDate, setDueDate] = useState(assignment?.dueDate ?? '');
  const [gradeReceived, setGradeReceived] = useState(
    assignment?.gradeReceived != null ? String(assignment.gradeReceived) : ''
  );
  const [totalPossible, setTotalPossible] = useState(
    String(assignment?.totalPossible ?? 100)
  );
  const [status, setStatus] = useState<AssignmentStatus>(
    assignment?.status ?? 'upcoming'
  );
  const [isExtraCredit, setIsExtraCredit] = useState(
    assignment?.isExtraCredit ?? false
  );
  const [notes, setNotes] = useState(assignment?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-set graded when grade received is entered
  useEffect(() => {
    if (gradeReceived !== '') {
      setStatus('graded');
    }
  }, [gradeReceived]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Calculate current total weight for the course (excluding this assignment if editing)
  const currentTotalWeight = useMemo(() => {
    const courseAssignments = state.assignments.filter(
      a => a.courseId === courseId && !a.isExtraCredit
    );
    return courseAssignments
      .filter(a => !isEdit || a.id !== assignment?.id)
      .filter(a => !a.isExtraCredit)
      .reduce((sum, a) => sum + a.weight, 0);
  }, [state.assignments, courseId, isEdit, assignment]);

  const newWeight = Number(weight) || 0;
  const projectedTotal = isExtraCredit
    ? currentTotalWeight
    : currentTotalWeight + newWeight;
  const wouldExceed100 = !isExtraCredit && projectedTotal > 100;

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Assignment name is required.';
    const w = Number(weight);
    if (isNaN(w) || w <= 0) newErrors.weight = 'Weight must be a positive number.';
    if (w > 100) newErrors.weight = 'Weight cannot exceed 100%.';
    const tp = Number(totalPossible);
    if (isNaN(tp) || tp <= 0) newErrors.totalPossible = 'Total possible must be > 0.';
    if (gradeReceived !== '') {
      const gr = Number(gradeReceived);
      if (isNaN(gr) || gr < 0) newErrors.gradeReceived = 'Grade must be ≥ 0.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Omit<Assignment, 'id'> = {
      courseId,
      name: name.trim(),
      category,
      weight: Number(weight),
      dueDate: dueDate || null,
      gradeReceived: gradeReceived !== '' ? Number(gradeReceived) : null,
      totalPossible: Number(totalPossible),
      status,
      isExtraCredit,
      notes: notes.trim(),
    };

    if (isEdit && assignment) {
      updateAssignment({ ...payload, id: assignment.id });
    } else {
      addAssignment(payload);
    }
    onClose();
  }

  const inputClass =
    'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400';

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  const pct =
    gradeReceived !== '' && totalPossible !== ''
      ? ((Number(gradeReceived) / Number(totalPossible)) * 100).toFixed(1)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Assignment' : 'Add Assignment'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Weight warning */}
          {wouldExceed100 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                This will bring the total weight to {projectedTotal}%,
                exceeding 100%. Consider adjusting weights.
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className={labelClass}>Assignment Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Midterm Exam"
              className={inputClass}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Category + Weight row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as AssignmentCategory)}
                className={inputClass}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Weight %</label>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                min={0}
                max={100}
                step={0.5}
                placeholder="e.g. 20"
                className={inputClass}
              />
              {errors.weight && (
                <p className="text-xs text-red-500 mt-1">{errors.weight}</p>
              )}
            </div>
          </div>

          {/* Due Date + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as AssignmentStatus)}
                className={inputClass}
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grade Received + Total Possible */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Grade Received</label>
              <input
                type="number"
                value={gradeReceived}
                onChange={e => setGradeReceived(e.target.value)}
                min={0}
                placeholder="e.g. 87"
                className={inputClass}
              />
              {errors.gradeReceived && (
                <p className="text-xs text-red-500 mt-1">{errors.gradeReceived}</p>
              )}
              {pct !== null && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  = {pct}%
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Total Possible</label>
              <input
                type="number"
                value={totalPossible}
                onChange={e => setTotalPossible(e.target.value)}
                min={1}
                placeholder="100"
                className={inputClass}
              />
              {errors.totalPossible && (
                <p className="text-xs text-red-500 mt-1">{errors.totalPossible}</p>
              )}
            </div>
          </div>

          {/* Extra Credit Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Extra Credit
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Adds to earned points without affecting weight total
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsExtraCredit(!isExtraCredit)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isExtraCredit ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isExtraCredit ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this assignment..."
              className={`${inputClass} resize-none`}
            />
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
              {isEdit ? 'Save Changes' : 'Add Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
