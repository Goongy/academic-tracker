# AcademicTracker

A fully-featured GPA and grade tracking dashboard built with Vite, React 18, TypeScript, and Tailwind CSS.

## Features

- **GPA Tracking** — term GPA and cumulative GPA using credit-hour-weighted calculation with standard +/- scale
- **Course Management** — add, edit, and delete courses with color coding, credit hours, pass/fail toggle, and final grade override
- **Assignment Tracking** — full CRUD for assignments with categories (quiz, midterm, final, lab, project, etc.), weights, due dates, and grades
- **Grade Calculations** — current grade, weighted grade, predicted final grade, and GPA points per course
- **"What I Need" Calculator** — shows the average score needed on remaining work to hit your target grade
- **Academic Insights** — strongest/weakest course, next deadline, GPA vs target summary
- **Upcoming Deadlines** — dashboard panel showing assignments due in the next 14 days
- **Missing Assignments** — highlighted panel for any assignments marked missing
- **Grade Trend Chart** — SVG line chart of grade scores over time with hover tooltips and an A-threshold line
- **Category Breakdown** — per-course bar showing weight distribution by assignment category
- **Dark Mode** — full dark mode via Tailwind `dark:` classes, toggled from sidebar or settings
- **Term Switcher** — sidebar dropdown to switch active term, filtering dashboard and courses view
- **Export / Import** — export full data as JSON (reimportable) or as flat CSV for Excel/Sheets
- **Seed Data** — realistic demo data loaded on first launch (or reset any time from Settings)
- **localStorage Persistence** — all data auto-saved on every change

## Tech Stack

| Tool | Version |
|------|---------|
| Vite | 5.x |
| React | 18.3 |
| TypeScript | 5.4 |
| Tailwind CSS | 3.4 |
| Lucide React | icons |
| uuid | ID generation |

No external chart libraries — the grade trend chart is pure SVG.

## Setup

```bash
# Clone / navigate to the project
cd /Users/ryan/Desktop/AcademicTracker

# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

The dev server starts at `http://localhost:5173`.

## File Structure

```
AcademicTracker/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx              # React entry point
    ├── index.css             # Tailwind directives + custom utilities
    ├── App.tsx               # Root component, dark mode effect
    ├── types/
    │   └── index.ts          # All TypeScript interfaces and types
    ├── utils/
    │   └── calculations.ts   # Grade/GPA math, date helpers
    ├── data/
    │   └── seedData.ts       # Demo courses + assignments
    ├── context/
    │   └── AppContext.tsx    # useReducer state, localStorage, export/import
    └── components/
        ├── Layout.tsx        # Sidebar, mobile header, view router
        ├── Dashboard.tsx     # Main dashboard with stats, insights, deadlines
        ├── CoursesView.tsx   # Course grid with search/filter
        ├── CourseDetail.tsx  # Full course view with assignment table + chart
        ├── SettingsView.tsx  # Appearance, GPA target, terms, data I/O
        ├── modals/
        │   ├── CourseModal.tsx      # Add/edit course form
        │   └── AssignmentModal.tsx  # Add/edit assignment form
        └── ui/
            ├── StatCard.tsx    # Reusable stat display card
            ├── CourseCard.tsx  # Course summary card for grid
            ├── ProgressBar.tsx # Reusable progress bar
            └── GradeChart.tsx  # SVG grade trend line chart
```

## Grade Scale

| Letter | GPA | Range |
|--------|-----|-------|
| A+ / A | 4.0 | 93–100% |
| A-     | 3.7 | 90–92% |
| B+     | 3.3 | 87–89% |
| B      | 3.0 | 83–86% |
| B-     | 2.7 | 80–82% |
| C+     | 2.3 | 77–79% |
| C      | 2.0 | 73–76% |
| C-     | 1.7 | 70–72% |
| D+     | 1.3 | 67–69% |
| D      | 1.0 | 63–66% |
| D-     | 0.7 | 60–62% |
| F      | 0.0 | < 60%  |
