import { useMemo } from 'react';
import {
  GraduationCap,
  TrendingUp,
  AlertCircle,
  Calendar,
  BookOpen,
  Award,
  Target,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateCourseGrade,
  calculateTermGPA,
  calculateCumulativeGPA,
  getGradeColor,
  getUpcomingAssignments,
  formatDate,
  getDaysUntil,
  getProgressBarColor,
} from '../utils/calculations';
import StatCard from './ui/StatCard';
import ProgressBar from './ui/ProgressBar';

const STATUS_BADGE: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  submitted: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  graded: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  missing: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const COLOR_ACCENT: Record<string, string> = {
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
};

export default function Dashboard() {
  const { state, setView, selectCourse } = useApp();

  const activeTerm = useMemo(
    () => state.terms.find(t => t.id === state.settings.activeTermId),
    [state.terms, state.settings.activeTermId]
  );

  const activeTermName = activeTerm?.name ?? '';

  const termCourses = useMemo(
    () => state.courses.filter(c => c.term === activeTermName),
    [state.courses, activeTermName]
  );

  // Grade info for each active term course
  const courseGradeMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateCourseGrade>>();
    for (const course of termCourses) {
      const assignments = state.assignments.filter(a => a.courseId === course.id);
      map.set(course.id, calculateCourseGrade(assignments));
    }
    return map;
  }, [termCourses, state.assignments]);

  const termGPA = useMemo(
    () => calculateTermGPA(state.courses, state.assignments, activeTermName),
    [state.courses, state.assignments, activeTermName]
  );

  const cumulativeGPA = useMemo(
    () => calculateCumulativeGPA(state.courses, state.assignments),
    [state.courses, state.assignments]
  );

  // Average grade across active term courses
  const avgGrade = useMemo(() => {
    const grades = termCourses
      .map(c => {
        const info = courseGradeMap.get(c.id)!;
        return info.predictedGrade ?? info.currentGrade;
      })
      .filter((g): g is number => g !== null);
    if (grades.length === 0) return null;
    return grades.reduce((a, b) => a + b, 0) / grades.length;
  }, [termCourses, courseGradeMap]);

  // Upcoming this week
  const upcomingWeek = useMemo(
    () => getUpcomingAssignments(state.assignments, 7),
    [state.assignments]
  );

  // Missing
  const missingCount = useMemo(
    () => state.assignments.filter(a => a.status === 'missing').length,
    [state.assignments]
  );

  // Strongest / Weakest course
  const { strongest, weakest } = useMemo(() => {
    let strongest: typeof termCourses[0] | null = null;
    let weakest: typeof termCourses[0] | null = null;
    let maxGrade = -Infinity;
    let minGrade = Infinity;

    for (const course of termCourses) {
      const info = courseGradeMap.get(course.id)!;
      const g = info.predictedGrade ?? info.currentGrade;
      if (g === null) continue;
      if (g > maxGrade) { maxGrade = g; strongest = course; }
      if (g < minGrade) { minGrade = g; weakest = course; }
    }
    return { strongest, weakest };
  }, [termCourses, courseGradeMap]);

  // Next deadline
  const nextDeadline = useMemo(() => {
    const upcoming = getUpcomingAssignments(state.assignments, 30);
    return upcoming[0] ?? null;
  }, [state.assignments]);

  // Upcoming 14 days
  const upcoming14 = useMemo(
    () => getUpcomingAssignments(state.assignments, 14),
    [state.assignments]
  );

  const gpaColor =
    termGPA >= 3.7
      ? 'emerald'
      : termGPA >= 3.0
      ? 'blue'
      : termGPA >= 2.0
      ? 'amber'
      : 'rose';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {activeTermName} · {termCourses.length} course{termCourses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Term GPA"
          value={termGPA.toFixed(2)}
          subtitle={activeTermName}
          icon={<GraduationCap className="w-5 h-5" />}
          color={gpaColor}
          trend={
            termGPA >= (state.settings.targetGPA ?? 0)
              ? 'up'
              : 'down'
          }
          trendLabel={`Target: ${state.settings.targetGPA.toFixed(1)}`}
        />
        <StatCard
          title="Cumulative GPA"
          value={cumulativeGPA.toFixed(2)}
          subtitle="All terms"
          icon={<TrendingUp className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          title="Current Average"
          value={avgGrade !== null ? `${avgGrade.toFixed(1)}%` : '—'}
          subtitle="Across active courses"
          icon={<Award className="w-5 h-5" />}
          color={
            avgGrade === null ? 'indigo'
            : avgGrade >= 90 ? 'emerald'
            : avgGrade >= 80 ? 'blue'
            : avgGrade >= 70 ? 'amber'
            : 'rose'
          }
        />
        <StatCard
          title="Due This Week"
          value={upcomingWeek.length}
          subtitle={`${missingCount} missing`}
          icon={<Calendar className="w-5 h-5" />}
          color={missingCount > 0 ? 'rose' : 'sky'}
        />
      </div>

      {/* Insights + Courses row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Insights */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            Academic Insights
          </h2>

          <div className="space-y-4">
            {/* Strongest Course */}
            {strongest && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Strongest Course
                </p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {strongest.code}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    const info = courseGradeMap.get(strongest.id)!;
                    const g = info.predictedGrade ?? info.currentGrade;
                    return g !== null ? `${g.toFixed(1)}% · ${info.letterGrade}` : '—';
                  })()}
                </p>
              </div>
            )}

            {/* Weakest Course */}
            {weakest && weakest.id !== strongest?.id && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Needs Attention
                </p>
                <p className={`text-sm font-semibold ${(() => {
                  const info = courseGradeMap.get(weakest.id)!;
                  const g = info.predictedGrade ?? info.currentGrade;
                  return g !== null && g < 70 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400';
                })()}`}>
                  {weakest.code}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    const info = courseGradeMap.get(weakest.id)!;
                    const g = info.predictedGrade ?? info.currentGrade;
                    return g !== null ? `${g.toFixed(1)}% · ${info.letterGrade}` : '—';
                  })()}
                </p>
              </div>
            )}

            {/* Next Deadline */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Next Deadline
              </p>
              {nextDeadline ? (
                <>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {nextDeadline.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(nextDeadline.dueDate)} ·{' '}
                    {(() => {
                      const d = getDaysUntil(nextDeadline.dueDate!);
                      if (d === 0) return 'Due today';
                      if (d === 1) return 'Due tomorrow';
                      return `In ${d} days`;
                    })()}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming deadlines</p>
              )}
            </div>

            {/* GPA vs Target */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                GPA vs Target
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  termGPA >= state.settings.targetGPA
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {termGPA.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  / {state.settings.targetGPA.toFixed(1)} target
                </span>
              </div>
              <ProgressBar
                value={(termGPA / 4.0) * 100}
                color={termGPA >= state.settings.targetGPA ? 'bg-emerald-500' : 'bg-amber-500'}
                height="sm"
              />
            </div>
          </div>
        </div>

        {/* Course Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Course Progress
            </h2>
            <button
              onClick={() => setView('courses')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all
            </button>
          </div>

          {termCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              No courses this term. Add one to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {termCourses.map(course => {
                const info = courseGradeMap.get(course.id)!;
                const displayGrade = info.predictedGrade ?? info.currentGrade;
                const gradeColor = getGradeColor(displayGrade);
                const progressColor = getProgressBarColor(displayGrade);
                const accentClass = COLOR_ACCENT[course.color] ?? COLOR_ACCENT['indigo'];

                return (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 cursor-pointer group"
                    onClick={() => {
                      selectCourse(course.id);
                      setView('course-detail');
                    }}
                  >
                    <div className={`w-1 h-12 rounded-full flex-shrink-0 ${accentClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {course.code}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mx-1.5">·</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {course.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`text-sm font-bold ${gradeColor}`}>
                            {displayGrade !== null ? `${displayGrade.toFixed(1)}%` : '—'}
                          </span>
                          <span className={`text-xs font-medium ${gradeColor}`}>
                            {info.letterGrade}
                          </span>
                        </div>
                      </div>
                      <ProgressBar
                        value={info.completedWeight}
                        color={progressColor}
                        height="xs"
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {info.completedWeight.toFixed(0)}% graded · {info.remainingWeight.toFixed(0)}% remaining
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          Upcoming Deadlines
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">— next 14 days</span>
        </h2>

        {upcoming14.length === 0 ? (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
            No upcoming deadlines in the next 14 days.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {upcoming14.map(assignment => {
              const course = state.courses.find(c => c.id === assignment.courseId);
              const daysUntil = assignment.dueDate ? getDaysUntil(assignment.dueDate) : null;
              const accentClass = course
                ? (COLOR_ACCENT[course.color] ?? COLOR_ACCENT['indigo'])
                : 'bg-gray-400';

              return (
                <div
                  key={assignment.id}
                  className="flex items-center gap-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 rounded-xl transition-colors"
                  onClick={() => {
                    if (course) {
                      selectCourse(course.id);
                      setView('course-detail');
                    }
                  }}
                >
                  <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${accentClass}`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {assignment.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {course?.code ?? '?'} · {formatDate(assignment.dueDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 ml-2">
                    {daysUntil !== null && (
                      <span className={`text-xs font-medium ${
                        daysUntil === 0
                          ? 'text-red-600 dark:text-red-400'
                          : daysUntil <= 2
                          ? 'text-orange-600 dark:text-orange-400'
                          : daysUntil <= 5
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {daysUntil === 0
                          ? 'Today'
                          : daysUntil === 1
                          ? 'Tomorrow'
                          : `${daysUntil}d`}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[assignment.status] ?? ''}`}>
                      {assignment.status}
                    </span>
                    {assignment.weight > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                        {assignment.weight}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Missing Assignments */}
      {missingCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Missing Assignments ({missingCount})
          </h2>
          <div className="space-y-2">
            {state.assignments
              .filter(a => a.status === 'missing')
              .map(assignment => {
                const course = state.courses.find(c => c.id === assignment.courseId);
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between text-sm cursor-pointer"
                    onClick={() => {
                      if (course) {
                        selectCourse(course.id);
                        setView('course-detail');
                      }
                    }}
                  >
                    <span className="text-red-700 dark:text-red-300 font-medium">
                      {assignment.name}
                    </span>
                    <span className="text-red-500 dark:text-red-400 text-xs">
                      {course?.code ?? '?'} · {assignment.weight}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
