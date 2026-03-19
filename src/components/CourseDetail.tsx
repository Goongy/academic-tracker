import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Target,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateCourseGrade,
  getGradeColor,
  getProgressBarColor,
  getNeededGrade,
  formatDate,
  percentageToLetterGrade,
} from '../utils/calculations';
import ProgressBar from './ui/ProgressBar';
import GradeChart from './ui/GradeChart';
import CourseModal from './modals/CourseModal';
import AssignmentModal from './modals/AssignmentModal';
import type { Assignment, AssignmentCategory, AssignmentStatus } from '../types';

type SortKey = 'dueDate' | 'category' | 'grade' | 'name';
type SortDir = 'asc' | 'desc';

const STATUS_BADGE: Record<AssignmentStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  submitted: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  graded: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  missing: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const CATEGORY_BADGE: Record<AssignmentCategory, string> = {
  assignment: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  quiz: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  midterm: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  final: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  exam: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  lab: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  project: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  participation: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const COLOR_ACCENT_FULL: Record<string, string> = {
  indigo: 'from-indigo-500 to-indigo-600',
  violet: 'from-violet-500 to-violet-600',
  sky: 'from-sky-500 to-sky-600',
  emerald: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  rose: 'from-rose-500 to-rose-600',
  cyan: 'from-cyan-500 to-cyan-600',
  orange: 'from-orange-500 to-orange-600',
};

const ALL_CATEGORIES: AssignmentCategory[] = [
  'assignment', 'quiz', 'midterm', 'final', 'exam', 'lab', 'project', 'participation', 'other',
];

const ALL_STATUSES: AssignmentStatus[] = ['upcoming', 'submitted', 'graded', 'missing'];

export default function CourseDetail() {
  const { state, setView, selectCourse, deleteCourse, deleteAssignment, updateAssignment } = useApp();
  const gradeScale = state.settings.gradeScale;

  const course = state.courses.find(c => c.id === state.selectedCourseId);
  const allAssignments = useMemo(
    () => state.assignments.filter(a => a.courseId === course?.id),
    [state.assignments, course?.id]
  );

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterCategory, setFilterCategory] = useState<AssignmentCategory | ''>('');
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | ''>('');
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(false);

  if (!course) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        Course not found.
        <button
          onClick={() => setView('courses')}
          className="block mx-auto mt-4 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  const gradeInfo = calculateCourseGrade(allAssignments, gradeScale);
  const displayGrade = gradeInfo.predictedGrade ?? gradeInfo.currentGrade;
  const gradeColor = getGradeColor(displayGrade);
  const progressColor = getProgressBarColor(displayGrade);
  const gradientClass = COLOR_ACCENT_FULL[course.color] ?? COLOR_ACCENT_FULL['indigo'];

  // Needed grade calculation
  const neededGrade =
    course.targetGrade !== null && gradeInfo.weightedGrade !== null
      ? getNeededGrade(gradeInfo.weightedGrade, gradeInfo.remainingWeight, course.targetGrade)
      : null;

  // Category weight breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; earned: number; count: number }> = {};
    for (const a of allAssignments) {
      if (a.isExtraCredit) continue;
      if (!map[a.category]) map[a.category] = { total: 0, earned: 0, count: 0 };
      map[a.category].total += a.weight;
      map[a.category].count += 1;
      if (a.status === 'graded' && a.gradeReceived !== null) {
        map[a.category].earned += (a.gradeReceived / a.totalPossible) * a.weight;
      }
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [allAssignments]);

  // Filtered + sorted assignments
  const filteredAssignments = useMemo(() => {
    let list = [...allAssignments];
    if (filterCategory) list = list.filter(a => a.category === filterCategory);
    if (filterStatus) list = list.filter(a => a.status === filterStatus);

    list.sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;

      switch (sortKey) {
        case 'dueDate':
          aVal = a.dueDate ?? 'zzz';
          bVal = b.dueDate ?? 'zzz';
          break;
        case 'category':
          aVal = a.category;
          bVal = b.category;
          break;
        case 'grade':
          aVal = a.gradeReceived !== null ? (a.gradeReceived / a.totalPossible) * 100 : -1;
          bVal = b.gradeReceived !== null ? (b.gradeReceived / b.totalPossible) * 100 : -1;
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [allAssignments, filterCategory, filterStatus, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-gray-300 dark:text-gray-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-indigo-500" />
      : <ChevronDown className="w-3 h-3 text-indigo-500" />;
  }

  function handleDeleteCourse() {
    if (!course) return;
    deleteCourse(course.id);
    selectCourse(null);
    setView('courses');
  }

  function handleQuickGrade(assignment: Assignment, received: string, total: string) {
    const gr = parseFloat(received);
    const tp = parseFloat(total);
    if (!isNaN(gr) && !isNaN(tp) && tp > 0) {
      updateAssignment({
        ...assignment,
        gradeReceived: gr,
        totalPossible: tp,
        status: 'graded',
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => {
              selectCourse(null);
              setView('courses');
            }}
            className="mt-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold text-white bg-gradient-to-r ${gradientClass} mb-1.5`}>
              {course.code}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {course.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {course.term} · {course.creditHours} credit hours
              {course.isPassFail ? ' · Pass/Fail' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCourseModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          {!confirmDeleteCourse ? (
            <button
              onClick={() => setConfirmDeleteCourse(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={handleDeleteCourse}
                className="px-3 py-2 text-xs font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmDeleteCourse(false)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warnings */}
      {gradeInfo.warnings.length > 0 && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            {gradeInfo.warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-700 dark:text-amber-300">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Grade Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Current Grade</p>
          <p className={`text-3xl font-bold ${gradeColor}`}>
            {gradeInfo.currentGrade !== null
              ? `${gradeInfo.currentGrade.toFixed(1)}%`
              : '—'}
          </p>
          <p className={`text-sm font-medium ${gradeColor}`}>
            {gradeInfo.currentGrade !== null
              ? percentageToLetterGrade(gradeInfo.currentGrade, gradeScale)
              : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Predicted Final</p>
          <p className={`text-3xl font-bold ${gradeColor}`}>
            {displayGrade !== null ? `${displayGrade.toFixed(1)}%` : '—'}
          </p>
          <p className={`text-sm font-medium ${gradeColor}`}>
            {gradeInfo.letterGrade}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">GPA Points</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {gradeInfo.gpaPoints.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">/ 4.0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Remaining Weight</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {gradeInfo.remainingWeight.toFixed(0)}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {gradeInfo.completedWeight.toFixed(0)}% done
          </p>
        </div>
      </div>

      {/* Progress + Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weight Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Weight Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Completed ({gradeInfo.completedWeight.toFixed(0)}%)</span>
              <span>Remaining ({gradeInfo.remainingWeight.toFixed(0)}%)</span>
            </div>
            {/* Stacked bar */}
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div
                className={`h-full ${progressColor} transition-all duration-500`}
                style={{ width: `${gradeInfo.completedWeight}%` }}
              />
              <div
                className="h-full bg-gray-200 dark:bg-gray-600 transition-all duration-500"
                style={{ width: `${gradeInfo.remainingWeight}%` }}
              />
            </div>
            <div className="space-y-2 mt-3">
              {categoryBreakdown.map(([cat, data]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                    <span className="capitalize">{cat}</span>
                    <span>{data.total}%</span>
                  </div>
                  <ProgressBar
                    value={data.total}
                    color={CATEGORY_BADGE[cat as AssignmentCategory]?.includes('indigo')
                      ? 'bg-indigo-400' : 'bg-gray-400'}
                    height="xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Target Grade */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            Grade Target
          </h3>
          {course.targetGrade !== null ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Target</span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {course.targetGrade}%
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                    ({percentageToLetterGrade(course.targetGrade, gradeScale)})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current trajectory</span>
                <span className={`text-lg font-bold ${gradeColor}`}>
                  {displayGrade !== null ? `${displayGrade.toFixed(1)}%` : '—'}
                </span>
              </div>
              {neededGrade !== null && gradeInfo.remainingWeight > 0 && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-0.5">
                    What you need on remaining work:
                  </p>
                  <p className={`text-2xl font-bold ${
                    neededGrade > 100
                      ? 'text-red-600 dark:text-red-400'
                      : neededGrade > 90
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {neededGrade > 100 ? '> 100%' : neededGrade < 0 ? 'Already there!' : `${neededGrade.toFixed(1)}%`}
                  </p>
                  {neededGrade > 100 && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      This target may no longer be achievable.
                    </p>
                  )}
                  {neededGrade < 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      You've already achieved your target!
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No target grade set. Edit the course to add one.
            </p>
          )}
        </div>
      </div>

      {/* Grade Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Grade Trend
        </h3>
        <GradeChart assignments={allAssignments} />
      </div>

      {/* Assignment Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Assignments ({allAssignments.length})
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Assignment
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as AssignmentCategory | '')}
            className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as AssignmentStatus | '')}
            className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {filteredAssignments.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
            No assignments match filters.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {[
                    { key: 'name', label: 'Name' },
                    { key: 'category', label: 'Category' },
                    { key: null, label: 'Weight' },
                    { key: 'dueDate', label: 'Due Date' },
                    { key: 'grade', label: 'Grade' },
                    { key: null, label: 'Status' },
                    { key: null, label: 'Actions' },
                  ].map((col, i) => (
                    <th
                      key={i}
                      className={`text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 px-2 ${
                        col.key ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''
                      }`}
                      onClick={() => col.key && toggleSort(col.key as SortKey)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.key && <SortIcon col={col.key as SortKey} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filteredAssignments.map(assignment => {
                  const pct =
                    assignment.gradeReceived !== null
                      ? (assignment.gradeReceived / assignment.totalPossible) * 100
                      : null;

                  return (
                    <AssignmentRow
                      key={assignment.id}
                      assignment={assignment}
                      pct={pct}
                      onEdit={() => setEditAssignment(assignment)}
                      onDelete={() => deleteAssignment(assignment.id)}
                      onQuickGrade={handleQuickGrade}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Breakdown Chart */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Category Breakdown
          </h3>
          <div className="space-y-3">
            {categoryBreakdown.map(([cat, data]) => {
              const earnedPct = data.total > 0 ? (data.earned / data.total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${CATEGORY_BADGE[cat as AssignmentCategory]}`}>
                        {cat}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {data.count} item{data.count !== 1 ? 's' : ''} · {data.total}% of grade
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${getGradeColor(earnedPct || null)}`}>
                      {earnedPct > 0 ? `${earnedPct.toFixed(1)}%` : 'Not graded'}
                    </span>
                  </div>
                  <ProgressBar
                    value={data.total}
                    color={getProgressBarColor(earnedPct || null)}
                    height="sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCourseModal && (
        <CourseModal course={course} onClose={() => setShowCourseModal(false)} />
      )}
      {showAddModal && (
        <AssignmentModal courseId={course.id} onClose={() => setShowAddModal(false)} />
      )}
      {editAssignment && (
        <AssignmentModal
          courseId={course.id}
          assignment={editAssignment}
          onClose={() => setEditAssignment(null)}
        />
      )}
    </div>
  );
}

// ── Assignment Row ─────────────────────────────────────────────────────────────

interface AssignmentRowProps {
  assignment: Assignment;
  pct: number | null;
  onEdit: () => void;
  onDelete: () => void;
  onQuickGrade: (a: Assignment, received: string, total: string) => void;
}

function AssignmentRow({ assignment, pct, onEdit, onDelete, onQuickGrade }: AssignmentRowProps) {
  const [editing, setEditing] = useState(false);
  const [received, setReceived] = useState(
    assignment.gradeReceived != null ? String(assignment.gradeReceived) : ''
  );
  const [total, setTotal] = useState(String(assignment.totalPossible));
  const [confirmDelete, setConfirmDelete] = useState(false);

  function commitGrade() {
    onQuickGrade(assignment, received, total);
    setEditing(false);
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      {/* Name */}
      <td className="py-2.5 px-2">
        <div>
          <span className="text-gray-800 dark:text-gray-200 font-medium">
            {assignment.name}
          </span>
          {assignment.isExtraCredit && (
            <span className="ml-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              +EC
            </span>
          )}
          {assignment.notes && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-xs">
              {assignment.notes}
            </p>
          )}
        </div>
      </td>

      {/* Category */}
      <td className="py-2.5 px-2">
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${CATEGORY_BADGE[assignment.category]}`}>
          {assignment.category}
        </span>
      </td>

      {/* Weight */}
      <td className="py-2.5 px-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {assignment.weight}%
        </span>
      </td>

      {/* Due Date */}
      <td className="py-2.5 px-2 text-sm text-gray-600 dark:text-gray-400">
        {formatDate(assignment.dueDate)}
      </td>

      {/* Grade */}
      <td className="py-2.5 px-2">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="number"
              value={received}
              onChange={e => setReceived(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitGrade()}
              className="w-16 px-1.5 py-1 text-xs rounded border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="pts"
            />
            <span className="text-gray-400 text-xs">/</span>
            <input
              type="number"
              value={total}
              onChange={e => setTotal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitGrade()}
              className="w-16 px-1.5 py-1 text-xs rounded border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="tot"
            />
            <button
              onClick={commitGrade}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-gray-400 hover:underline"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-left hover:underline"
          >
            {pct !== null ? (
              <span className={`font-medium ${getGradeColor(pct)}`}>
                {assignment.gradeReceived}/{assignment.totalPossible}
                <span className="text-xs ml-1">({pct.toFixed(1)}%)</span>
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-xs">Click to add</span>
            )}
          </button>
        )}
      </td>

      {/* Status */}
      <td className="py-2.5 px-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[assignment.status]}`}>
          {assignment.status}
        </span>
      </td>

      {/* Actions */}
      <td className="py-2.5 px-2">
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={onDelete}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
