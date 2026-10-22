# Pairzen

> **Tagline:** Code together. Think beyond.

Pairzen is a premium, real-time collaborative coding interview platform designed for engineering teams and interviewers. It enables simultaneous multi-cursor pair programming, sandboxed code execution, structured assessment rubrics, and playback telemetry in a sleek, developer-focused environment.

---

## Status & Progress

- **Phase 1: Foundation & Premium UI** — Completed ✅
- **Phase 2: Secure Authentication & User Profiles** — Completed ✅
- **Phase 3: Interview Room Management & Secure Joining** — Completed ✅
- **Phase 4: Real-Time Collaborative Workspace & Live Code Synchronization** — Next Phase 🚀

---

## Phase 3: Interview Room Management & Secure Joining

Phase 3 introduces a robust, database-backed room management architecture in MongoDB, cryptographic invitation tokens, room-level role authorization, server-enforced lifecycle transitions, and real-time dashboard aggregation.

### Key Implemented Features:

1. **Persistent MongoDB Interview Room Model (`InterviewRoom`)**:
   - `roomCode`: Human-readable, unique identifier formatted as `pz-XXXX-YYYY` with collision-retry generation and unique indexing.
   - `title` & `description`: Structured interview challenge objectives.
   - `creatorId`: Reference to the host user document (`User`).
   - `language`: Configurable runtime track (`typescript`, `javascript`, `python`, `java`, `cpp`, `go`, `rust`).
   - `difficulty`: Challenge target tier (`easy`, `medium`, `hard`).
   - `durationMinutes`: Configurable assessment duration (15 to 180 minutes).
   - `accessPolicy`: `invite_only` (private, token-gated) or `discoverable` (authenticated members).
   - `status`: Server-enforced lifecycle status (`waiting`, `active`, `completed`, `cancelled`).
   - `invitationTokenHash`: SHA-256 hash of the random 64-character hex invitation secret. Raw tokens are never stored in plaintext.
   - `invitationRevoked`: Boolean flag allowing hosts to invalidate existing invitation links.
   - `participants`: Structured array of room participant sub-documents with role (`interviewer`, `candidate`, `observer`), join timestamps, and identity snapshots.
   - **Indexes**: Compound indexes on `{ creatorId: 1, status: 1 }`, `{ "participants.userId": 1 }`, `{ roomCode: 1 }` (unique), and `{ createdAt: -1 }`.

2. **Room Access & Cryptographic Invitation System**:
   - **Invitation Links**: Generated as `[app_origin]/join?token=[rawToken]&code=[roomCode]`.
   - **Token Validation**: Verified server-side via SHA-256 hashing. Prevents unauthorized users from guessing room IDs or room codes to access private rooms.
   - **Rate Limiting**: `POST /api/interviews/join` is protected by IP-based rate limiting (20 attempts / min) to prevent room-code enumeration and brute-force token guessing.
   - **Token Rotation**: Authorized interviewers can rotate invitation tokens at any time, instantly revoking previous links.

3. **Room-Level Role Authorization & Concurrency**:
   - Creator is automatically registered as the room `interviewer`.
   - Joining users receive `candidate` permissions. Role escalation by clients is strictly rejected.
   - **Idempotent Joins**: Users cannot join a room multiple times as duplicate participants; existing membership returns immediate entry.
   - **Atomic Concurrency**: Join operations utilize MongoDB atomic filters (`"participants.userId": { $ne: userId }`) to guarantee safety under simultaneous concurrent requests.

4. **Server-Enforced Room Lifecycle**:
   - **Waiting → Active**: Only the authorized host/interviewer can start the session. Sets `startedAt` timestamp.
   - **Active → Completed**: Only the interviewer can complete the session. Sets `endedAt` timestamp.
   - **Waiting → Cancelled**: Host can cancel waiting sessions.
   - **Invalid Transitions**: Rejected with `400 Bad Request`. Cancelled or completed rooms reject any subsequent join attempts.

5. **Pages & Frontend Integration**:
   - `/interviews/new`: Dedicated interview creation form with client/server validation, technical track configuration, duration selector, and security access policy.
   - `/join`: Secure entry gateway supporting both one-click invitation acceptance and manual room-code entry.
   - `/interviews/[roomId]`: Premium room management shell with metadata badges, live status indicator, host lifecycle controls, participant directory, real clipboard copy actions, and Phase 4 workspace placeholder.
   - `/dashboard`: Completely backed by live MongoDB queries. Features real-time status tabs (`All`, `Live Now`, `Waiting`, `Completed`, `Cancelled`), local search, room code copying, and real database aggregate statistics.
   - `CreateInterviewModal` & `JoinInterviewModal`: Fully wired to real MongoDB API endpoints.

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account, creates session & sets cookie | No (Rate Limited) |
| `POST` | `/api/auth/login` | Authenticate credentials, rotate session & set cookie | No (Rate Limited) |
| `GET` | `/api/auth/me` | Retrieve currently authenticated user from session cookie | Yes (`401` if invalid) |
| `POST` | `/api/auth/logout` | Revoke session from MongoDB and clear cookie | Yes |
| `PATCH` | `/api/users/me` | Update permitted profile fields (`name`, `avatarUrl`) | Yes (`403` on role edit) |

### Phase 3 Interview Room Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/interviews` | Create new interview room & generate cryptographic invitation | Yes |
| `GET` | `/api/interviews` | List rooms where user is creator or participant (with filters) | Yes |
| `GET` | `/api/interviews/:roomId` | Retrieve authorized room details (verifies membership/access) | Yes (`403` on private) |
| `POST` | `/api/interviews/join` | Join room via room code and/or invitation token | Yes (Rate Limited) |
| `POST` | `/api/interviews/:roomId/invitation` | Rotate invitation token and generate fresh invitation link | Host Only (`403`) |
| `POST` | `/api/interviews/:roomId/start` | Transition room from `waiting` to `active` | Host Only (`403`) |
| `POST` | `/api/interviews/:roomId/end` | Transition room from `active` to `completed` | Host Only (`403`) |
| `POST` | `/api/interviews/:roomId/cancel` | Cancel a `waiting` interview room | Host Only (`403`) |
| `GET` | `/api/interviews/:roomId/participants` | Retrieve authorized participant roster | Members Only |

---

## Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS v4 with custom navy & violet design tokens
- **Icons**: Lucide React
- **Database**: MongoDB 8+ (Mongoose ODM)
- **Validation**: Zod schema validation (server & client)
- **Password Security**: Bcrypt (cost factor 12)
- **Sessions & Tokens**: Cryptographic opaque tokens (SHA-256 hashes at rest)
- **Testing**: Node.js Native Test Runner (`node --test`)

---

## Environment Variables

Configure `.env.local` for local execution:

```env
# MongoDB Connection URI (Local or Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017/pairzen

# Node Environment ('development' | 'production')
NODE_ENV=development

# Session Cookie Secret
SESSION_SECRET=pairzen_local_development_secret_32_characters_key_99

# Base Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Dedicated Test Database URI (for npm run test)
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/pairzen_test
```

---

## Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Ensure MongoDB is running**:
   - Local: MongoDB service running on `mongodb://127.0.0.1:27017`
   - Or configure your MongoDB Atlas connection string in `.env.local`.

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

---

## Running Automated Tests

Pairzen uses Node.js's native test runner for fast, dependency-free automated testing against an isolated test database.

```bash
npm run test
```

### Test Coverage Highlights:
- **Suite 1: Authentication & Authorization (`tests/auth.test.mjs`)**: 11 tests covering bcrypt password hashing, session tokens, session revocation, cookie policies, and role escalation defenses.
- **Suite 2: Phase 3 Room Management (`tests/interview-room.test.mjs`)**: 15 tests covering room creation, code collisions, private access denial, invitation validation, duplicate join idempotency, host role verification, lifecycle transitions (`waiting` → `active` → `completed` / `cancelled`), cancelled room rejection, dashboard query boundaries, and atomic race-condition safety.

Total: **26 passing tests** with 0 failures.

---

## Security Assumptions & Boundaries

- **Invitation Confidentiality**: The invitation token is secret and shared only between the interviewer and authorized candidates.
- **Role Immutability**: Candidates cannot self-promote to interviewers. Room creator identity is determined server-side from session cookies.
- **Strict Scope Boundaries**: Real-time Socket.IO multi-cursor synchronization, Monaco editor integration, and code execution are strictly scoped for Phase 4. The room details page provides a clear preview notice without simulating fake live collaboration.
