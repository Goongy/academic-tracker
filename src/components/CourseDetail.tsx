import { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Target,
  ChevronUp,
  ChevronDown,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  FileText,
  Upload,
  Eye,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateCourseGrade,
  getGradeColor,
  getNeededGrade,
  formatDate,
  percentageToLetterGrade,
} from '../utils/calculations';
import CourseModal from './modals/CourseModal';
import AssignmentModal from './modals/AssignmentModal';
import type { Assignment, AssignmentCategory, AssignmentStatus, ProfessorInfo } from '../types';

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

const SYLLABUS_KEY = (courseId: string) => `academic-tracker-syllabus-${courseId}`;

const EMPTY_PROFESSOR: ProfessorInfo = {
  name: '', email: '', phone: '', office: '', officeHours: '',
};

export default function CourseDetail() {
  const { state, setView, selectCourse, deleteCourse, deleteAssignment, updateAssignment, updateCourse } = useApp();
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

  // Professor editing state
  const [editingProfessor, setEditingProfessor] = useState(false);
  const [professorDraft, setProfessorDraft] = useState<ProfessorInfo>(EMPTY_PROFESSOR);

  // Syllabus
  const syllabusInputRef = useRef<HTMLInputElement>(null);

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
  const gradientClass = COLOR_ACCENT_FULL[course.color] ?? COLOR_ACCENT_FULL['indigo'];

  // Needed grade calculation
  const neededGrade =
    course.targetGrade !== null && gradeInfo.weightedGrade !== null
      ? getNeededGrade(gradeInfo.weightedGrade, gradeInfo.remainingWeight, course.targetGrade)
      : null;

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
    // Clean up syllabus from localStorage
    try { localStorage.removeItem(SYLLABUS_KEY(course.id)); } catch {}
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

  // Professor helpers
  function startEditProfessor() {
    if (!course) return;
    setProfessorDraft(course.professor ? { ...course.professor } : { ...EMPTY_PROFESSOR });
    setEditingProfessor(true);
  }

  function saveProfessor() {
    if (!course) return;
    const hasSomeValue = Object.values(professorDraft).some(v => v.trim() !== '');
    updateCourse({
      ...course,
      professor: hasSomeValue ? professorDraft : undefined,
    });
    setEditingProfessor(false);
  }

  // Syllabus helpers
  function handleSyllabusUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!course) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Please upload a PDF under 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const base64 = ev.target?.result as string;
        localStorage.setItem(SYLLABUS_KEY(course.id), base64);
        updateCourse({
          ...course,
          syllabus: {
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          },
        });
      } catch {
        alert('Could not save syllabus. Storage may be full.');
      }
    };
    reader.readAsDataURL(file);
    if (syllabusInputRef.current) syllabusInputRef.current.value = '';
  }

  function handleViewSyllabus() {
    if (!course) return;
    const data = localStorage.getItem(SYLLABUS_KEY(course.id));
    if (!data) return;
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${data}" style="width:100%;height:100%;border:none;" />`);
    }
  }

  function handleRemoveSyllabus() {
    if (!course) return;
    try { localStorage.removeItem(SYLLABUS_KEY(course.id)); } catch {}
    updateCourse({ ...course, syllabus: undefined });
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const inputClass =
    'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

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

      {/* Professor Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            Professor
          </h3>
          {!editingProfessor && (
            <button
              onClick={startEditProfessor}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              {course.professor ? 'Edit' : 'Add'}
            </button>
          )}
        </div>

        {editingProfessor ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={professorDraft.name}
                  onChange={e => setProfessorDraft(p => ({ ...p, name: e.target.value }))}
                  placeholder="Dr. Jane Smith"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={professorDraft.email}
                  onChange={e => setProfessorDraft(p => ({ ...p, email: e.target.value }))}
                  placeholder="jsmith@university.edu"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={professorDraft.phone}
                  onChange={e => setProfessorDraft(p => ({ ...p, phone: e.target.value }))}
                  placeholder="(902) 555-0100"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Office</label>
                <input
                  type="text"
                  value={professorDraft.office}
                  onChange={e => setProfessorDraft(p => ({ ...p, office: e.target.value }))}
                  placeholder="LSC 3rd Floor, Room 312"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Office Hours</label>
              <input
                type="text"
                value={professorDraft.officeHours}
                onChange={e => setProfessorDraft(p => ({ ...p, officeHours: e.target.value }))}
                placeholder="Mon/Wed 2–4pm, or by appointment"
                className={inputClass}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveProfessor}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingProfessor(false)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : course.professor && Object.values(course.professor).some(v => v) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {course.professor.name && (
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{course.professor.name}</p>
                </div>
              </div>
            )}
            {course.professor.email && (
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <a
                    href={`mailto:${course.professor.email}`}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {course.professor.email}
                  </a>
                </div>
              </div>
            )}
            {course.professor.phone && (
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{course.professor.phone}</p>
                </div>
              </div>
            )}
            {course.professor.office && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Office</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{course.professor.office}</p>
                </div>
              </div>
            )}
            {course.professor.officeHours && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Office Hours</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{course.professor.officeHours}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No professor details added yet.
          </p>
        )}
      </div>

      {/* Syllabus */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          Syllabus
        </h3>

        {course.syllabus ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{course.syllabus.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatBytes(course.syllabus.size)} · Uploaded {new Date(course.syllabus.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewSyllabus}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </button>
              <button
                onClick={() => syllabusInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Replace
              </button>
              <button
                onClick={handleRemoveSyllabus}
                className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Remove syllabus"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => syllabusInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Upload Syllabus PDF</span>
            <span className="text-xs">Max 10 MB</span>
          </button>
        )}

        <input
          ref={syllabusInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleSyllabusUpload}
          className="hidden"
        />
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
