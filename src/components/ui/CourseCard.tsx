import { AlertTriangle, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateCourseGrade, getGradeColor, getProgressBarColor } from '../../utils/calculations';
import ProgressBar from './ProgressBar';

interface CourseCardProps {
  courseId: string;
}

const colorAccentMap: Record<string, string> = {
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
};

const colorBadgeMap: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

export default function CourseCard({ courseId }: CourseCardProps) {
  const { state, setView, selectCourse } = useApp();
  const course = state.courses.find(c => c.id === courseId);
  if (!course) return null;

  const assignments = state.assignments.filter(a => a.courseId === courseId);
  const gradeInfo = calculateCourseGrade(assignments);

  const displayGrade = gradeInfo.predictedGrade ?? gradeInfo.currentGrade;
  const gradeColor = getGradeColor(displayGrade);
  const progressColor = getProgressBarColor(displayGrade);

  const accentClass = colorAccentMap[course.color] ?? colorAccentMap['indigo'];
  const badgeClass = colorBadgeMap[course.color] ?? colorBadgeMap['indigo'];

  const isBelowTarget =
    course.targetGrade !== null &&
    displayGrade !== null &&
    displayGrade < course.targetGrade;

  const handleClick = () => {
    selectCourse(courseId);
    setView('course-detail');
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 group"
      onClick={handleClick}
    >
      {/* Color accent bar */}
      <div className={`h-1.5 w-full ${accentClass}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md mb-1.5 ${badgeClass}`}>
              {course.code}
            </span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {course.name}
            </h3>
          </div>
          <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2 mt-1" />
        </div>

        {/* Term + Credits */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {course.term} · {course.creditHours} cr
        </p>

        {/* Grade Display */}
        {course.isPassFail ? (
          <div className="mb-4">
            <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">P/F</span>
          </div>
        ) : (
          <div className="flex items-end gap-2 mb-4">
            <span className={`text-3xl font-bold ${gradeColor}`}>
              {displayGrade !== null ? `${displayGrade.toFixed(1)}%` : '—'}
            </span>
            <span className={`text-lg font-semibold mb-0.5 ${gradeColor}`}>
              {gradeInfo.letterGrade}
            </span>
          </div>
        )}

        {/* Progress bar - completed weight */}
        {!course.isPassFail && (
          <div className="mb-3">
            <ProgressBar
              value={gradeInfo.completedWeight}
              color={progressColor}
              label="Completed"
              showLabel
              height="sm"
            />
          </div>
        )}

        {/* GPA Points */}
        {!course.isPassFail && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">GPA Points</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {gradeInfo.gpaPoints.toFixed(1)}
            </span>
          </div>
        )}

        {/* Warning */}
        {isBelowTarget && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Below target ({course.targetGrade}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
