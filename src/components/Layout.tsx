import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  Moon,
  Sun,
  Menu,
  GraduationCap,
  ChevronDown,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Dashboard from './Dashboard';
import CoursesView from './CoursesView';
import CourseDetail from './CourseDetail';
import SettingsView from './SettingsView';
import ImportsView from './ImportsView';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'imports', label: 'Imports', icon: Upload },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { state, setView, updateSettings, setActiveTerm } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [termDropdownOpen, setTermDropdownOpen] = useState(false);

  const activeTerm = state.terms.find(t => t.id === state.settings.activeTermId);

  function toggleDark() {
    updateSettings({ darkMode: !state.settings.darkMode });
  }

  function handleNav(view: string) {
    setView(view);
    setSidebarOpen(false);
  }

  function handleTermChange(termId: string) {
    setActiveTerm(termId);
    setTermDropdownOpen(false);
  }

  function renderView() {
    switch (state.currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'courses':
        return <CoursesView />;
      case 'course-detail':
        return <CourseDetail />;
      case 'imports':
        return <ImportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <button
        onClick={() => handleNav('dashboard')}
        className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors w-full text-left"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
            AcademicTracker
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">GPA Dashboard</p>
        </div>
      </button>

      {/* Term Switcher */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-2">
          Active Term
        </p>
        <div className="relative">
          <button
            onClick={() => setTermDropdownOpen(!termDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
              {activeTerm?.name ?? 'No term'}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${termDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {termDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              {state.terms.map(term => (
                <button
                  key={term.id}
                  onClick={() => handleTermChange(term.id)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    term.id === state.settings.activeTermId
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {term.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-2">
          Navigation
        </p>
        {NAV_ITEMS.map(item => {
          const isActive =
            state.currentView === item.id ||
            (item.id === 'courses' && state.currentView === 'course-detail');
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} style={{ width: 18, height: 18 }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Dark mode toggle */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={toggleDark}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {state.settings.darkMode ? 'Dark Mode' : 'Light Mode'}
          </span>
          {state.settings.darkMode ? (
            <Moon className="w-4 h-4 text-indigo-500" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 fixed h-full z-10">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">AcademicTracker</span>
          </div>
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {state.settings.darkMode ? (
              <Moon className="w-5 h-5 text-indigo-500" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderView()}
        </main>
      </div>

      {/* Click outside to close term dropdown */}
      {termDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setTermDropdownOpen(false)}
        />
      )}
    </div>
  );
}
