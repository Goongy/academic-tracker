import { useState, useMemo } from 'react';
import { Plus, Search, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CourseCard from './ui/CourseCard';
import CourseModal from './modals/CourseModal';

export default function CoursesView() {
  const { state } = useApp();
  const [search, setSearch] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // All unique terms across courses
  const allTerms = useMemo(
    () => Array.from(new Set(state.courses.map(c => c.term))).sort().reverse(),
    [state.courses]
  );

  const activeTerm = state.terms.find(t => t.id === state.settings.activeTermId);

  // Default filter to active term
  const effectiveFilter = filterTerm || activeTerm?.name || '';

  const filteredCourses = useMemo(() => {
    return state.courses.filter(course => {
      const matchesTerm = !effectiveFilter || course.term === effectiveFilter;
      const matchesSearch =
        !search ||
        course.name.toLowerCase().includes(search.toLowerCase()) ||
        course.code.toLowerCase().includes(search.toLowerCase());
      return matchesTerm && matchesSearch;
    });
  }, [state.courses, effectiveFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
            {effectiveFilter ? ` · ${effectiveFilter}` : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterTerm('')}
            className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
              !filterTerm
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Active Term
          </button>
          {allTerms.map(term => (
            <button
              key={term}
              onClick={() => setFilterTerm(term === filterTerm ? '' : term)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
                filterTerm === term
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {term}
            </button>
          ))}
          {filterTerm && (
            <button
              onClick={() => setFilterTerm('')}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              All Terms
            </button>
          )}
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {search ? 'No courses match your search' : 'No courses yet'}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {!search && 'Click "Add Course" to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} courseId={course.id} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && <CourseModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
