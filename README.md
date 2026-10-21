# Pairzen

> **Tagline:** Code together. Think beyond.

Pairzen is a premium, real-time collaborative coding interview platform designed for engineering teams and interviewers. It enables simultaneous multi-cursor pair programming, sandboxed code execution, structured assessment rubrics, and playback telemetry in a sleek, developer-focused environment.

---

## Current Status: Phase 1 (Foundation & Premium UI)

Phase 1 establishes the complete frontend foundation, architecture, brand identity, design token system, and responsive UI for both the public landing page and the interview management dashboard.

### Phase 1 Scope (Implemented):
- **Brand Identity & Design System**: Custom SVG mark and typography, dark navy palette (`#0B1020`), surface tokens (`#121A2B`), electric violet accents (`#8B5CF6`), and sky blue highlights (`#38BDF8`).
- **Public Landing Page (`/`)**:
  - Sticky glassmorphic navbar with mobile navigation drawer.
  - Value-driven hero section with brand pillars.
  - Interactive dual-collaborator IDE preview showcasing multi-cursor editing, presence indicators, problem drawer, and executable test suite simulations.
  - Comprehensive feature breakdown (Real-time sync, Shared rooms, Sandboxed execution, Standardized scoring).
  - Clear 3-step technical workflow ("How It Works").
  - Architecture roadmap & blueprint comparison.
  - Professional footer with status and legal links.
- **Dashboard (`/dashboard`)**:
  - Collapsible desktop sidebar and mobile drawer with Pairzen branding and workspace navigation.
  - Top header with global search, unread notification center dropdown, quick creation action, and user profile menu.
  - Welcome banner with session summaries and quick interview creation/joining affordances.
  - Real-time statistics cards (Total interviews, Completed sessions, Upcoming sessions, Average duration).
  - Quick action shortcuts (Instant Room, Question Library, Evaluation Rubrics, System Diagnostics).
  - Filterable interview table with search query filtering, status tabs ("All", "Live Now", "Scheduled", "Completed"), copyable room codes, and session inspection modal.
- **Reusable Component Library**:
  - Buttons (`primary`, `secondary`, `outline`, `ghost`, `danger`, `subtle`)
  - Badges & Status Indicators
  - Cards & Statistics containers
  - Inputs & Select controls
  - Accessible Modals / Dialogs (with ESC and backdrop handling)
  - Dropdown menus with item actions and separators
  - Avatar with fallback initials and status indicators
  - Empty states with action triggers
  - Tabs with count badges
- **Types & Mock Data Layer**: Strict TypeScript models (`InterviewSession`, `DashboardStats`, `UserNotification`) with isolated mock repositories ready to be swapped with API endpoints.

---

## Features Intentionally Deferred to Future Phases

Per Phase 1 scope restrictions, the following are not implemented in Phase 1 and are architectural targets for subsequent phases:
- **Phase 2**:
  - Socket.IO server & WebSockets for bidirectional editor synchronizer
  - Monaco Editor (VS Code core) integration with syntax tree AST binding
  - Multi-cursor CRDT/OT collaborative state management
  - WebRTC live audio/video presence streams
- **Phase 3**:
  - Node.js / Express backend service
  - MongoDB database schemas & Mongoose data models
  - User authentication, JWT sessions, and RBAC (Interviewer vs. Candidate vs. Admin)
  - Sandboxed remote code runner (gVisor/Docker runner worker)
  - Question bank persistence and customizable rubric scoring exports

---

## Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript 5 (Strict type checking enabled)
- **Styling**: Tailwind CSS v4 with bespoke token variables
- **Icons**: Lucide React
- **Component Model**: React Server Components by default; client components (`"use client"`) only for interactive controls (modals, dropdowns, tabs, sidebar).

---

## Prerequisites

- **Node.js**: v20+ (tested and verified on Node v24.11.1)
- **npm**: v10+ (tested on npm 11.6.2)

---

## Installation & Setup

1. **Clone the repository** (or navigate to workspace directory):
   ```bash
   git clone <repo-url>
   cd Pairzen
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run TypeScript check**:
   ```bash
   npx tsc --noEmit
   ```

5. **Run production build**:
   ```bash
   npm run build
   ```

6. **Start production server**:
   ```bash
   npm run start
   ```

---

## Routes

| Route | Purpose | Status |
|---|---|---|
| `/` | Public Landing Page, Product Workspace Preview, Capabilities, Workflow | Complete |
| `/dashboard` | Interviewer Management Dashboard, Stats, Sessions Table, Creation Modal | Complete |

---

## License

Copyright © 2026 Pairzen Inc. All rights reserved.
# PairZen
