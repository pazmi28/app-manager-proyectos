# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start       # Dev server at localhost:3000
npm run build   # Production bundle
```

No test or lint scripts are configured yet.

## Stack

React 18 SPA with Firebase (Auth + Firestore), React Router v6, and react-hot-toast. Built with Create React App (`react-scripts`). No TypeScript — all source files are `.jsx`/`.js`.

## Architecture

```
src/
├── App.jsx               # Route definitions and auth-based guards
├── context/AuthContext.jsx  # Firebase Auth state via onAuthStateChanged
├── hooks/useAuth.js      # Consumes AuthContext; exposes user, loading, login/register/logout
├── firebase/config.js    # Firebase SDK init and exports (db, auth)
├── pages/                # One file per route
├── components/layout/    # Layout + Topbar (authenticated shell)
└── styles/global.css     # Design tokens (CSS vars) and shared component classes
```

### Routing model

`App.jsx` has two route groups:
- **Public** (`/login`, `/register`) — redirect to `/dashboard` if already authenticated.
- **Protected** (`/`, `/dashboard`, `/sessions`, `/new-project`) — redirect to `/login` if not authenticated. Root `/` redirects to `/dashboard`.

A `loading` guard in `App.jsx` prevents rendering until Firebase resolves the initial auth state.

### Auth pattern

Components call `useAuth()` to get `{ user, loading, login, register, logout }`. Never import Firebase directly in pages/components — go through the hook or context.

### Styling

`src/styles/global.css` defines the design system (dark theme, CSS custom properties for color, spacing, shadows). Use existing CSS variables and utility classes rather than inline styles or a CSS-in-JS library.

### Firebase

Firestore is connected (`db` exported from `firebase/config.js`) but no data models exist yet. Sprint 2 will add project management features (projects list, sessions, new-project creation).

## Current development state

Sprint 1 (auth + layout) is complete. Sprint 2 will implement the dashboard with a projects list, the sessions page, and the new-project creation flow. The UI is in Spanish.

## Data Model

Firestore collections:

### `projects` (root collection)

Each document includes the `userId` of the owner.

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `description` | string | |
| `stack` | string | |
| `status` | string | `"active"` \| `"paused"` \| `"done"` |
| `methodology` | string \| null | `"metodologia_v5.1"` \| `"free"` \| `null` |
| `currentSprint` | number | |
| `progress` | number | 0–100, auto-calculated from completed checklist items |
| `repoUrl` | string | |
| `vercelUrl` | string | |
| `userId` | string | |
| `createdAt` | serverTimestamp | |
| `updatedAt` | serverTimestamp | |

### `projects/{id}/checklist` (subcollection)

| Field | Type | Notes |
|---|---|---|
| `phase` | string | e.g. `"Sprint 0"` |
| `item` | string | |
| `done` | boolean | |
| `completedAt` | timestamp \| null | |
| `notes` | string | |

### `sessions` (root collection)

| Field | Type | Notes |
|---|---|---|
| `projectId` | string | |
| `userId` | string | |
| `date` | serverTimestamp | |
| `summary` | string | |
| `type` | string | `"checklist"` \| `"custom"` |
| `itemsCompleted` | array | item IDs |
| `tags` | array | |
| `source` | string | `"web"` \| `"mcp"` |

## Project Context

Personal dashboard to track progress on development projects.

### Methodology types

- **`metodologia_v5.1`** — auto-generates a checklist for Sprints 0–7. Progress = completed items / total items.
- **`free`** — no checklist. Progress driven by custom sessions.
- **`null`** — no methodology assigned yet. No progress bar shown.

### Critical rules

- Always use `serverTimestamp()` in writes — never `new Date()`.
- Toasts only in hooks, never in components.
- All hooks must be declared before any conditional `return`.
- Always include `userId` in `addDoc` calls for `projects` and `sessions`.
- Hook files use `default` exports; utility files use `named` exports.
- Run `node --check <file>` to validate syntax before committing.
