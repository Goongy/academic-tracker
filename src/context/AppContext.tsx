import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppData, Course, Assignment, Term, AppSettings } from '../types';
import { getSeedData } from '../data/seedData';

const STORAGE_KEY = 'academic-tracker-data';

// ── State ──────────────────────────────────────────────────────────────────────

export interface AppState extends AppData {
  currentView: string;
  selectedCourseId: string | null;
}

// ── Actions ────────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_COURSE'; payload: Course }
  | { type: 'UPDATE_COURSE'; payload: Course }
  | { type: 'DELETE_COURSE'; payload: string }
  | { type: 'ADD_ASSIGNMENT'; payload: Assignment }
  | { type: 'UPDATE_ASSIGNMENT'; payload: Assignment }
  | { type: 'DELETE_ASSIGNMENT'; payload: string }
  | { type: 'ADD_TERM'; payload: Term }
  | { type: 'UPDATE_TERM'; payload: Term }
  | { type: 'SET_VIEW'; payload: string }
  | { type: 'SELECT_COURSE'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'IMPORT_DATA'; payload: AppData }
  | { type: 'LOAD_DATA'; payload: AppData };

// ── Reducer ────────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.payload] };

    case 'UPDATE_COURSE':
      return {
        ...state,
        courses: state.courses.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case 'DELETE_COURSE':
      return {
        ...state,
        courses: state.courses.filter(c => c.id !== action.payload),
        assignments: state.assignments.filter(a => a.courseId !== action.payload),
        selectedCourseId:
          state.selectedCourseId === action.payload ? null : state.selectedCourseId,
        currentView:
          state.selectedCourseId === action.payload ? 'courses' : state.currentView,
      };

    case 'ADD_ASSIGNMENT':
      return { ...state, assignments: [...state.assignments, action.payload] };

    case 'UPDATE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map(a =>
          a.id === action.payload.id ? action.payload : a
        ),
      };

    case 'DELETE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.filter(a => a.id !== action.payload),
      };

    case 'ADD_TERM':
      return { ...state, terms: [...state.terms, action.payload] };

    case 'UPDATE_TERM': {
      let updatedTerms = state.terms.map(t =>
        t.id === action.payload.id ? action.payload : t
      );
      // If this term is set to active, deactivate others
      if (action.payload.isActive) {
        updatedTerms = updatedTerms.map(t =>
          t.id !== action.payload.id ? { ...t, isActive: false } : t
        );
      }
      const newActiveTermId = action.payload.isActive
        ? action.payload.id
        : state.settings.activeTermId;
      return {
        ...state,
        terms: updatedTerms,
        settings: { ...state.settings, activeTermId: newActiveTermId },
      };
    }

    case 'SET_VIEW':
      return { ...state, currentView: action.payload };

    case 'SELECT_COURSE':
      return { ...state, selectedCourseId: action.payload };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'IMPORT_DATA':
    case 'LOAD_DATA':
      return {
        ...state,
        courses: action.payload.courses,
        assignments: action.payload.assignments,
        terms: action.payload.terms,
        settings: action.payload.settings,
      };

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  updateAssignment: (assignment: Assignment) => void;
  deleteAssignment: (id: string) => void;
  addTerm: (name: string) => void;
  setActiveTerm: (termId: string) => void;
  setView: (view: string) => void;
  selectCourse: (courseId: string | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  exportToJSON: () => void;
  exportToCSV: () => void;
  importFromJSON: (file: File) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadFromStorage(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppData;
    // Basic validation
    if (!parsed.courses || !parsed.assignments || !parsed.terms || !parsed.settings) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(data: AppData) {
  try {
    const toSave: AppData = {
      courses: data.courses,
      assignments: data.assignments,
      terms: data.terms,
      settings: data.settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage full or unavailable
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const stored = loadFromStorage();
  const seed = getSeedData();

  const initialState: AppState = {
    ...(stored ?? seed),
    currentView: 'dashboard',
    selectedCourseId: null,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist on every state change (skip UI-only fields)
  useEffect(() => {
    saveToStorage({
      courses: state.courses,
      assignments: state.assignments,
      terms: state.terms,
      settings: state.settings,
    });
  }, [state.courses, state.assignments, state.terms, state.settings]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addCourse = useCallback((course: Omit<Course, 'id'>) => {
    dispatch({ type: 'ADD_COURSE', payload: { ...course, id: uuidv4() } });
  }, []);

  const updateCourse = useCallback((course: Course) => {
    dispatch({ type: 'UPDATE_COURSE', payload: course });
  }, []);

  const deleteCourse = useCallback((id: string) => {
    dispatch({ type: 'DELETE_COURSE', payload: id });
  }, []);

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id'>) => {
    dispatch({ type: 'ADD_ASSIGNMENT', payload: { ...assignment, id: uuidv4() } });
  }, []);

  const updateAssignment = useCallback((assignment: Assignment) => {
    dispatch({ type: 'UPDATE_ASSIGNMENT', payload: assignment });
  }, []);

  const deleteAssignment = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ASSIGNMENT', payload: id });
  }, []);

  const addTerm = useCallback((name: string) => {
    const term: Term = { id: uuidv4(), name, isActive: false };
    dispatch({ type: 'ADD_TERM', payload: term });
  }, []);

  const setActiveTerm = useCallback((termId: string) => {
    const term = state.terms.find(t => t.id === termId);
    if (term) {
      dispatch({ type: 'UPDATE_TERM', payload: { ...term, isActive: true } });
    }
  }, [state.terms]);

  const setView = useCallback((view: string) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const selectCourse = useCallback((courseId: string | null) => {
    dispatch({ type: 'SELECT_COURSE', payload: courseId });
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  // ── Export / Import ───────────────────────────────────────────────────────

  const exportToJSON = useCallback(() => {
    const data: AppData = {
      courses: state.courses,
      assignments: state.assignments,
      terms: state.terms,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const exportToCSV = useCallback(() => {
    const rows: string[] = [];
    rows.push(
      'Course Code,Course Name,Term,Credit Hours,Assignment Name,Category,Weight,Due Date,Grade Received,Total Possible,Percentage,Status,Is Extra Credit,Notes'
    );

    for (const course of state.courses) {
      const courseAssignments = state.assignments.filter(a => a.courseId === course.id);
      if (courseAssignments.length === 0) {
        rows.push(
          [
            course.code,
            `"${course.name}"`,
            `"${course.term}"`,
            course.creditHours,
            '', '', '', '', '', '', '', '', '', '',
          ].join(',')
        );
      } else {
        for (const a of courseAssignments) {
          const pct =
            a.gradeReceived !== null
              ? ((a.gradeReceived / a.totalPossible) * 100).toFixed(1)
              : '';
          rows.push(
            [
              course.code,
              `"${course.name}"`,
              `"${course.term}"`,
              course.creditHours,
              `"${a.name}"`,
              a.category,
              a.weight,
              a.dueDate ?? '',
              a.gradeReceived ?? '',
              a.totalPossible,
              pct,
              a.status,
              a.isExtraCredit ? 'Yes' : 'No',
              `"${a.notes}"`,
            ].join(',')
          );
        }
      }
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importFromJSON = useCallback(async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string) as AppData;
          if (!parsed.courses || !parsed.assignments || !parsed.terms || !parsed.settings) {
            reject(new Error('Invalid file format'));
            return;
          }
          dispatch({ type: 'IMPORT_DATA', payload: parsed });
          resolve();
        } catch {
          reject(new Error('Failed to parse JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  const value: AppContextValue = {
    state,
    dispatch,
    addCourse,
    updateCourse,
    deleteCourse,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    addTerm,
    setActiveTerm,
    setView,
    selectCourse,
    updateSettings,
    exportToJSON,
    exportToCSV,
    importFromJSON,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
