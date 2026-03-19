export type AssignmentCategory =
  | 'assignment'
  | 'quiz'
  | 'midterm'
  | 'final'
  | 'lab'
  | 'participation'
  | 'project'
  | 'exam'
  | 'other';

export type AssignmentStatus = 'upcoming' | 'submitted' | 'graded' | 'missing';

export interface Assignment {
  id: string;
  courseId: string;
  name: string;
  category: AssignmentCategory;
  weight: number; // percent of final grade
  dueDate: string | null; // ISO date string
  gradeReceived: number | null;
  totalPossible: number;
  notes: string;
  status: AssignmentStatus;
  isExtraCredit: boolean;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  term: string; // e.g. "Spring 2025"
  creditHours: number;
  targetGrade: number | null; // percentage target
  finalGradeOverride: number | null; // manual override
  isPassFail: boolean;
  color: string; // tailwind color class prefix, e.g. "indigo"
}

export interface Term {
  id: string;
  name: string; // e.g. "Spring 2025"
  isActive: boolean;
}

export interface AppSettings {
  darkMode: boolean;
  targetGPA: number;
  activeTermId: string;
}

export interface AppData {
  courses: Course[];
  assignments: Assignment[];
  terms: Term[];
  settings: AppSettings;
}

export interface CourseGradeInfo {
  currentGrade: number | null;    // % based on graded work
  weightedGrade: number | null;   // weighted contribution earned
  predictedGrade: number | null;  // projected final %
  completedWeight: number;        // sum of weights of graded items
  remainingWeight: number;        // sum of weights of ungraded items
  letterGrade: string;
  gpaPoints: number;
  warnings: string[];
}
