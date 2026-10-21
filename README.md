# Pairzen

> **Tagline:** Code together. Think beyond.

Pairzen is a premium, real-time collaborative coding interview platform designed for engineering teams and interviewers. It enables simultaneous multi-cursor pair programming, sandboxed code execution, structured assessment rubrics, and playback telemetry in a sleek, developer-focused environment.

---

## Status & Progress

- **Phase 1: Foundation & Premium UI** — Completed ✅
- **Phase 2: Secure Authentication & User Profiles** — Completed ✅
- **Phase 3: Real-Time Collaborative Workspace & Room Engine** — Next Phase 🚀

---

## Phase 2: Implemented Authentication & Profile System

Phase 2 establishes persistent user accounts in MongoDB, secure password hashing, opaque revocable session management, role-based authorization foundations, and authenticated routes.

### Key Implemented Features:
1. **Persistent MongoDB User & Session Models**:
   - `User`: Unique normalized email index, trimmed names, bcrypt password hash (`select: false`), role (`user`, `interviewer`, `admin`), avatar URL, account status, and automatic timestamps.
   - `Session`: Hashed session tokens (SHA-256) stored in database, user reference, user agent, IP, and automatic MongoDB TTL expiration index (`expires: 0`).
2. **Security & Session Architecture**:
   - **Password Hashing**: Bcrypt with 12 salt rounds. Plaintext passwords are never stored, logged, or returned.
   - **Opaque Server-Side Sessions**: 32-byte cryptographically secure random session tokens (`crypto.randomBytes(32)`).
   - **Token Hashing at Rest**: Raw tokens are never stored in MongoDB in plaintext; only their SHA-256 digests (`tokenHash`) are persisted.
   - **Cookie Policy**: Cookies are set with `HttpOnly`, `SameSite=lax`, `Path=/`, and `Secure` when in production.
   - **Rate Limiting**: Sliding window rate limiter protects registration (5 req / 15m) and login (6 req / 10m) from brute-force enumeration.
   - **Account Enumeration Defense**: Login returns generic *"Invalid email or password"* failure messages.
   - **Session Fixation Prevention**: Session tokens are newly generated on every successful authentication.
   - **Session Invalidation**: Complete revocation on logout removes the session from the database and zeroes the cookie.
3. **Authentication Pages**:
   - `/register`: Full name, email, password strength meter (Very Weak / Weak / Fair / Good / Strong + checklist), confirm password matching, role selection (`user` / `interviewer`), terms acknowledgement, and error alerts.
   - `/login`: Email, password, visibility toggle, remember-me (30-day session extension), forgot-password notice, and open-redirect protection.
   - `/profile`: Protected user settings page displaying account creation date, role badge, editable display name, and avatar URL.
4. **Role-Based Authorization & Privilege Protection**:
   - Public registration defaults to `user` (or `interviewer`), with server-side restriction preventing self-assignment of `admin`.
   - `PATCH /api/users/me` strictly allows modifying only permitted fields (`name`, `avatarUrl`) and rejects any attempt to modify `role`, `email`, `passwordHash`, or `status` with `403 Forbidden`.
   - `/dashboard` and `/profile` are protected; unauthenticated access redirects to `/login`.
   - Authenticated user state dynamically replaces mock data in the dashboard header and sidebar.

---

## Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account, creates session & sets cookie | No (Rate Limited) |
| `POST` | `/api/auth/login` | Authenticate credentials, rotate session & set cookie | No (Rate Limited) |
| `GET` | `/api/auth/me` | Retrieve currently authenticated user from session cookie | Yes (`401` if invalid) |
| `POST` | `/api/auth/logout` | Revoke session from MongoDB and clear cookie | Yes |
| `PATCH` | `/api/users/me` | Update permitted profile fields (`name`, `avatarUrl`) | Yes (`403` on role edit) |

---

## Technology Stack

- **Frontend**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS v4 with curated design tokens
- **Icons**: Lucide React
- **Database**: MongoDB 8+ (Mongoose ODM)
- **Validation**: Zod server & client schema validation
- **Password Security**: Bcrypt (cost factor 12)
- **Sessions**: Cryptographic opaque tokens, SHA-256 storage, HTTP-only cookies

---

## Environment Variables

Copy `.env.example` to `.env.local` for local development:

```env
# MongoDB Connection URI (Local or Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017/pairzen

# Node Environment ('development' | 'production')
NODE_ENV=development

# Session Encryption / Secret
SESSION_SECRET=pairzen_local_development_secret_32_characters_key_99

# Base Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Ensure MongoDB is running**:
   - Local: MongoDB service running on `mongodb://127.0.0.1:27017`
   - Or configure your MongoDB Atlas connection string in `.env.local`.

3. **Run automated test suite**:
   ```bash
   npm test
   ```
   Runs 11 automated test cases covering registration, login, hashing, duplicate rejection, session revocation, and privilege protection.

4. **Run TypeScript type checking**:
   ```bash
   npx tsc --noEmit
   ```

5. **Run ESLint checks**:
   ```bash
   npm run lint
   ```

6. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

7. **Build and run production bundle**:
   ```bash
   npm run build
   npm run start
   ```

---

## Features Intentionally Deferred to Phase 3 & Beyond

- Socket.IO collaboration and multi-cursor state sync
- Monaco Editor code workspace binding
- Sandboxed remote code execution runtimes
- WebRTC live audio/video presence streams
- Question bank authoring & custom algorithmic challenge templates
- Automated SMTP / Resend email password recovery

---

## License

Copyright © 2026 Pairzen Inc. All rights reserved.
