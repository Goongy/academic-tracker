import type { Assignment, Course, CourseGradeInfo, GradeScaleEntry } from '../types';

function applyScale<T>(
  pct: number,
  gradeScale: GradeScaleEntry[] | undefined,
  picker: (e: GradeScaleEntry) => T,
  fallback: () => T,
): T {
  if (gradeScale && gradeScale.length > 0) {
    const sorted = [...gradeScale].sort((a, b) => b.minPercent - a.minPercent);
    for (const entry of sorted) {
      if (pct >= entry.minPercent) return picker(entry);
    }
    return picker(sorted[sorted.length - 1]);
  }
  return fallback();
}

export function percentageToLetterGrade(pct: number, gradeScale?: GradeScaleEntry[]): string {
  return applyScale(pct, gradeScale, e => e.letter, () => {
    if (pct >= 97) return 'A+';
    if (pct >= 93) return 'A';
    if (pct >= 90) return 'A-';
    if (pct >= 87) return 'B+';
    if (pct >= 83) return 'B';
    if (pct >= 80) return 'B-';
    if (pct >= 77) return 'C+';
    if (pct >= 73) return 'C';
    if (pct >= 70) return 'C-';
    if (pct >= 67) return 'D+';
    if (pct >= 63) return 'D';
    if (pct >= 60) return 'D-';
    return 'F';
  });
}

export function percentageToGPA(pct: number, gradeScale?: GradeScaleEntry[]): number {
  return applyScale(pct, gradeScale, e => e.gpaPoints, () => {
    if (pct >= 97) return 4.0;
    if (pct >= 93) return 4.0;
    if (pct >= 90) return 3.7;
    if (pct >= 87) return 3.3;
    if (pct >= 83) return 3.0;
    if (pct >= 80) return 2.7;
    if (pct >= 77) return 2.3;
    if (pct >= 73) return 2.0;
    if (pct >= 70) return 1.7;
    if (pct >= 67) return 1.3;
    if (pct >= 63) return 1.0;
    if (pct >= 60) return 0.7;
    return 0.0;
  });
}

export function calculateCourseGrade(assignments: Assignment[], gradeScale?: GradeScaleEntry[]): CourseGradeInfo {
  const warnings: string[] = [];

  // Separate extra credit and regular assignments
  const regularAssignments = assignments.filter(a => !a.isExtraCredit);
  const extraCreditAssignments = assignments.filter(a => a.isExtraCredit);

  // Check total weight
  const totalRegularWeight = regularAssignments.reduce((sum, a) => sum + a.weight, 0);
  if (totalRegularWeight > 100) {
    warnings.push(`Total assignment weight (${totalRegularWeight.toFixed(1)}%) exceeds 100%.`);
  }
  if (totalRegularWeight < 100 && regularAssignments.length > 0) {
    warnings.push(`Total assignment weight (${totalRegularWeight.toFixed(1)}%) is less than 100%.`);
  }

  // Graded regular assignments
  const gradedRegular = regularAssignments.filter(
    a => a.status === 'graded' && a.gradeReceived !== null
  );

  // Graded extra credit
  const gradedEC = extraCreditAssignments.filter(
    a => a.status === 'graded' && a.gradeReceived !== null
  );

  const completedWeight = gradedRegular.reduce((sum, a) => sum + a.weight, 0);
  const remainingWeight = Math.max(0, 100 - completedWeight);

  if (gradedRegular.length === 0 && gradedEC.length === 0) {
    return {
      currentGrade: null,
      weightedGrade: null,
      predictedGrade: null,
      completedWeight: 0,
      remainingWeight: totalRegularWeight,
      letterGrade: '—',
      gpaPoints: 0,
      warnings,
    };
  }

  // Calculate weighted earned points from regular graded assignments
  let weightedEarned = gradedRegular.reduce((sum, a) => {
    const score = (a.gradeReceived! / a.totalPossible) * 100;
    return sum + (score * a.weight) / 100;
  }, 0);

  // Add extra credit (adds to earned but not to denominator)
  const ecEarned = gradedEC.reduce((sum, a) => {
    const score = (a.gradeReceived! / a.totalPossible) * 100;
    return sum + (score * a.weight) / 100;
  }, 0);
  weightedEarned += ecEarned;

  const weightedGrade = weightedEarned;

  // currentGrade: percentage based on completed weight
  const currentGrade = completedWeight > 0
    ? (weightedEarned / (completedWeight / 100))
    : null;

  // predictedGrade: project current performance onto remaining work
  const predictedGrade = currentGrade !== null
    ? Math.min(100, weightedEarned + (currentGrade * remainingWeight) / 100)
    : null;

  const displayGrade = predictedGrade ?? currentGrade ?? 0;
  const letterGrade = currentGrade !== null ? percentageToLetterGrade(displayGrade, gradeScale) : '—';
  const gpaPoints = currentGrade !== null ? percentageToGPA(displayGrade, gradeScale) : 0;

  return {
    currentGrade,
    weightedGrade,
    predictedGrade,
    completedWeight,
    remainingWeight,
    letterGrade,
    gpaPoints,
    warnings,
  };
}

export function calculateTermGPA(
  courses: Course[],
  assignments: Assignment[],
  termName: string,
  gradeScale?: GradeScaleEntry[]
): number {
  const termCourses = courses.filter(c => c.term === termName);
  if (termCourses.length === 0) return 0;

  let totalQualityPoints = 0;
  let totalCreditHours = 0;

  for (const course of termCourses) {
    if (course.isPassFail) continue;

    const courseAssignments = assignments.filter(a => a.courseId === course.id);
    let gradeInfo: CourseGradeInfo;

    if (course.finalGradeOverride !== null) {
      const pct = course.finalGradeOverride;
      const gpa = percentageToGPA(pct, gradeScale);
      totalQualityPoints += gpa * course.creditHours;
      totalCreditHours += course.creditHours;
      continue;
    }

    gradeInfo = calculateCourseGrade(courseAssignments, gradeScale);
    const effectiveGrade = gradeInfo.predictedGrade ?? gradeInfo.currentGrade;
    if (effectiveGrade === null) continue;

    totalQualityPoints += gradeInfo.gpaPoints * course.creditHours;
    totalCreditHours += course.creditHours;
  }

  return totalCreditHours > 0
    ? Math.round((totalQualityPoints / totalCreditHours) * 100) / 100
    : 0;
}

export function calculateCumulativeGPA(
  courses: Course[],
  assignments: Assignment[],
  gradeScale?: GradeScaleEntry[]
): number {
  if (courses.length === 0) return 0;

  let totalQualityPoints = 0;
  let totalCreditHours = 0;

  for (const course of courses) {
    if (course.isPassFail) continue;

    const courseAssignments = assignments.filter(a => a.courseId === course.id);

    if (course.finalGradeOverride !== null) {
      const pct = course.finalGradeOverride;
      const gpa = percentageToGPA(pct, gradeScale);
      totalQualityPoints += gpa * course.creditHours;
      totalCreditHours += course.creditHours;
      continue;
    }

    const gradeInfo = calculateCourseGrade(courseAssignments, gradeScale);
    const effectiveGrade = gradeInfo.predictedGrade ?? gradeInfo.currentGrade;
    if (effectiveGrade === null) continue;

    totalQualityPoints += gradeInfo.gpaPoints * course.creditHours;
    totalCreditHours += course.creditHours;
  }

  return totalCreditHours > 0
    ? Math.round((totalQualityPoints / totalCreditHours) * 100) / 100
    : 0;
}

export function getNeededGrade(
  currentWeightedEarned: number,
  remainingWeight: number,
  targetGrade: number
): number {
  if (remainingWeight <= 0) return 0;
  // needed = (target - currentWeightedEarned) / (remainingWeight / 100)
  const needed = (targetGrade - currentWeightedEarned) / (remainingWeight / 100);
  return Math.round(needed * 10) / 10;
}

export function getGradeColor(pct: number | null): string {
  if (pct === null) return 'text-gray-400 dark:text-gray-500';
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 80) return 'text-blue-600 dark:text-blue-400';
  if (pct >= 70) return 'text-yellow-600 dark:text-yellow-400';
  if (pct >= 60) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

export function getGradeBgColor(pct: number | null): string {
  if (pct === null) return 'bg-gray-100 dark:bg-gray-700';
  if (pct >= 90) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (pct >= 80) return 'bg-blue-100 dark:bg-blue-900/30';
  if (pct >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30';
  if (pct >= 60) return 'bg-orange-100 dark:bg-orange-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No date';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateFull(dateStr: string | null): string {
  if (!dateStr) return 'No date';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  due.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function getUpcomingAssignments(
  assignments: Assignment[],
  days: number = 7
): Assignment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(future.getDate() + days);

  return assignments
    .filter(a => {
      if (!a.dueDate) return false;
      if (a.status === 'graded') return false;
      const due = new Date(a.dueDate + 'T00:00:00');
      return due >= today && due <= future;
    })
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
}

export function getProgressBarColor(pct: number | null): string {
  if (pct === null) return 'bg-gray-300 dark:bg-gray-600';
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 80) return 'bg-blue-500';
  if (pct >= 70) return 'bg-yellow-500';
  if (pct >= 60) return 'bg-orange-500';
  return 'bg-red-500';
}
