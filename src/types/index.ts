export interface GradeScaleEntry {
  letter: string;
  minPercent: number; // minimum percentage (inclusive) for this grade
  gpaPoints: number;
}

// Dalhousie University official grade scale
// https://www.dal.ca/academics/academic_support/registrars_office/grading.html
export const DALHOUSIE_GRADE_SCALE: GradeScaleEntry[] = [
  { letter: 'A+', minPercent: 90, gpaPoints: 4.3 },
  { letter: 'A',  minPercent: 85, gpaPoints: 4.0 },
  { letter: 'A-', minPercent: 80, gpaPoints: 3.7 },
  { letter: 'B+', minPercent: 77, gpaPoints: 3.3 },
  { letter: 'B',  minPercent: 73, gpaPoints: 3.0 },
  { letter: 'B-', minPercent: 70, gpaPoints: 2.7 },
  { letter: 'C+', minPercent: 65, gpaPoints: 2.3 },
  { letter: 'C',  minPercent: 60, gpaPoints: 2.0 },
  { letter: 'C-', minPercent: 55, gpaPoints: 1.7 },
  { letter: 'D',  minPercent: 50, gpaPoints: 1.0 },
  { letter: 'F',  minPercent: 0,  gpaPoints: 0.0 },
];

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

export interface ProfessorInfo {
  name: string;
  email: string;
  phone: string;
  office: string;
  officeHours: string;
}

export interface SyllabusInfo {
  name: string;
  size: number;
  uploadedAt: string; // ISO date string
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
  professor?: ProfessorInfo;
  syllabus?: SyllabusInfo;
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
  gradeScale: GradeScaleEntry[];
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
