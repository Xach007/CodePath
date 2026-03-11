# Workspace

## Overview

pnpm workspace monorepo using TypeScript. CodePath — a Duolingo/Mimo-style interactive programming learning platform with courses, quizzes, coding challenges, XP, streaks, achievements, leaderboard, and a gamified dark-mode-capable UI.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite 7 + TailwindCSS v4 + shadcn/ui + Framer Motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod` — date fields use `zod.coerce.date()` to accept both Date objects and ISO strings
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **Markdown**: react-markdown + remark-gfm
- **Animations**: framer-motion, canvas-confetti

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port from PORT env)
│   ├── learn/              # React + Vite frontend (the main web app)
│   └── mockup-sandbox/     # Component preview server for canvas
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (seed, etc.)
│   └── src/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Frontend (`artifacts/learn`)

React 19 + Vite app mounted at `/`. Uses wouter for routing, TanStack React Query for data fetching, shadcn/ui for components.

### Pages
- **Landing** (`/`) — Hero section, login/register modals, features section
- **Dashboard** (`/dashboard`) — Welcome banner, active course progress, stats grid, level card, recent achievements
- **Courses** (`/courses`) — Course library grid with animated cards
- **Course Detail** (`/courses/:id`) — Course hero, stats, syllabus with accordion modules listing all lessons
- **Lesson** (`/lessons/:id`) — Immersive lesson view (no standard layout):
  - Theory: Markdown content with lesson type badge and "Complete & Continue" button
  - Quiz: Multi-question MCQ with step-by-step navigation ("Question 1 of 3"), progress dots, answer locking after submit, per-question feedback, and collective pass/fail with retry
  - Challenge: Desktop split-pane (instructions + Monaco editor + test results); Mobile tabbed layout (Instructions/Code/Results tabs) with auto-switch to results on failure
  - Error output display: Runtime errors, stdout output, and per-test expected/actual comparison
  - Test result counter badge (passed/total) in the results panel header
- **Profile** (`/profile`) — User stats, level progress, course progress
- **Achievements** (`/achievements`) — Achievement grid (locked/unlocked)
- **Leaderboard** (`/leaderboard`) — Top users by XP
- **Admin** (`/admin`) — Admin login + dashboard with sidebar tabs: Dashboard stats, Courses CRUD (with modules/lessons), Users management, Achievements CRUD

### Key Features
- **Dark mode**: Toggle in navbar, persists to localStorage, applies `dark` class to `<html>`
- **Auth**: JWT stored in localStorage, injected via global fetch interceptor in `lib/auth.ts`; auto-logout on 401
- **Gamification UI**: XP and streak badges in navbar, confetti on lesson completion, success overlay with XP and achievements
- **Custom CSS**: Inter + Plus Jakarta Sans fonts, indigo/purple/amber/green palette with dark mode variants, glassmorphism navbar, gradient text utilities, glow effects, shimmer/float/fadeUp animations, card-hover transitions
- **Progress component**: Extended with `indicatorClassName` prop for custom indicator colors
- **Routing**: Flat route structure in App.tsx (wouter nested Switch caused blank pages); Layout wraps interior pages via LayoutPage wrapper component; admin route uses render function syntax `{() => <AdminPage />}` instead of `component` prop for wouter v3 compatibility
- **Production build**: Replit proxy serves from production build (`dist/public`), not the Vite dev server. After code changes, run `pnpm --filter @workspace/learn run build` to update the production build (Vite config uses sensible defaults for PORT and BASE_PATH)
- **Page transitions**: Smooth fade-up animation via `PageWrapper` (motion.div) applied to layout-wrapped pages
- **Dashboard redirect**: Uses `useEffect` to avoid React "setState during render" warning

## Backend (`artifacts/api-server`)

Express 5 API server. All routes under `/api`.

### Admin System
- **Default admin account** seeded on startup: `admin` / `admin123` / `admin@example.com`
- Admin credentials printed to terminal on server start
- `isAdmin` boolean column on `users` table
- Admin middleware (`adminAuth.ts`) validates token + checks `isAdmin` flag
- Admin panel frontend at `/admin` with separate auth token (`admin_token` in localStorage)

### Routes
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Courses**: `GET /api/courses` (public), `GET /api/courses/:courseId` (public, published-only; includes modules with full lesson arrays)
- **Modules**: `GET /api/modules/:moduleId` (includes lessons)
- **Lessons**: `GET /api/lessons/:lessonId`, `POST /api/lessons/:lessonId/complete`, `POST /api/lessons/:lessonId/quiz`, `POST /api/lessons/:lessonId/code`
- **Gamification**: `GET /api/gamification/profile`, `GET /api/gamification/leaderboard`
- **Progress**: `GET /api/progress`, `GET /api/progress/courses/:courseId`
- **Admin**: `POST /api/admin/login`, `GET /api/admin/stats`, full CRUD for `/api/admin/users`, `/api/admin/courses`, `/api/admin/modules`, `/api/admin/lessons`, `/api/admin/quiz-questions`, `/api/admin/quiz-options`, `/api/admin/coding-challenges`, `/api/admin/test-cases`, `/api/admin/achievements`

### Auth
- Simple SHA256 hashing with static salt (not bcrypt)
- JWT-like base64 token with userId + expiry
- `authMiddleware` validates token and attaches userId to request

### Code Execution
- Python code execution via `child_process.exec` with 5-second timeout
- Located in `src/lib/codeRunner.ts`

### Gamification
- XP awarded per lesson completion (configurable per lesson)
- Levels at 100 XP increments
- Streaks track daily activity (resets after missing a day)
- Achievements unlock automatically via `checkAndUnlockAchievements()` in `src/lib/gamification.ts`

## Database Schema

Tables in `lib/db/src/schema/`:
- `users` — id, username, email, passwordHash, displayName, avatarUrl
- `user_xp` — userId, totalXP, currentLevel
- `user_streaks` — userId, currentStreak, longestStreak, lastActivityDate
- `courses` — id, title, description, language, difficulty, imageUrl, totalLessons, estimatedHours, xpReward, isPublished
- `modules` — id, courseId, title, description, orderIndex
- `lessons` — id, moduleId, title, type (theory/quiz/challenge), content, orderIndex, xpReward, estimatedMinutes
- `quiz_questions` — id, lessonId, question, explanation, orderIndex
- `quiz_options` — id, questionId, text, isCorrect
- `coding_challenges` — id, lessonId, instructions, starterCode, solutionCode, language, hints
- `test_cases` — id, challengeId, name, input, expectedOutput, isHidden
- `user_lesson_progress` — userId, lessonId, completedAt, score
- `user_course_enrollments` — userId, courseId, startedAt, completedAt
- `achievements` — id, title, description, icon, condition, threshold
- `user_achievements` — userId, achievementId, unlockedAt

## Seed Data

Run: `pnpm --filter @workspace/scripts run seed`

Seeds 2 courses (Python Fundamentals, Web Development Basics), 3 modules, 9 lessons (theory + quiz + challenge each), and 11 achievements.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck; actual JS bundling handled by esbuild/tsx/vite
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Key Commands

- Dev frontend: `pnpm --filter @workspace/learn run dev`
- Dev API: `pnpm --filter @workspace/api-server run dev`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
- DB push: `pnpm --filter @workspace/db run push`
- Seed: `pnpm --filter @workspace/scripts run seed`
