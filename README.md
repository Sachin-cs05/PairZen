# Pairzen

> **Tagline:** Code together. Think beyond.

Pairzen is a premium, real-time collaborative coding interview platform designed for engineering teams and interviewers. It enables simultaneous multi-cursor pair programming, conflict-free collaborative editing, sandboxed code execution, structured assessment rubrics, and playback telemetry in a sleek, developer-focused environment.

---

## Status & Progress

- **Phase 1: Foundation & Premium UI** — Completed ✅
- **Phase 2: Secure Authentication & User Profiles** — Completed ✅
- **Phase 3: Interview Room Management & Secure Joining** — Completed ✅
- **Phase 4: Real-Time Collaborative Coding Workspace** — Completed ✅
- **Phase 5: Sandboxed Code Execution & Testing Runner** — Next Phase 🚀

---

## Phase 4: Real-Time Collaborative Coding Workspace

Phase 4 introduces an industrial-grade, concurrent collaborative coding workspace combining Microsoft's Monaco Editor, Yjs Conflict-Free Replicated Data Types (CRDTs), a persistent Socket.IO transport engine, and continuous durable state persistence in MongoDB.

### Architecture Overview

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│     Client A (Interviewer)      │           │      Client B (Candidate)       │
│  - Monaco Editor ("pairzen-dark")│          │  - Monaco Editor ("pairzen-dark")│
│  - Yjs Client Doc + Awareness   │           │  - Yjs Client Doc + Awareness   │
│  - Socket.IO Client             │           │  - Socket.IO Client             │
└──────────────┬──────────────────┘           └──────────────┬──────────────────┘
               │                                             │
               │ (collab:join, collab:update,                │
               │  collab:awareness, collab:presence)         │
               ▼                                             ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│               Pairzen Collaboration Service (collab-server.ts)                 │
│  - Standalone Node.js HTTP + Socket.IO Engine (:3001)                         │
│  - Handshake Auth Middleware: validates pz_session with MongoDB               │
│  - Server-Side Room Authorization: verifies creator vs candidate membership   │
│  - Room-Scoped Isolation: pz_room:${roomCode} channels                        │
│  - In-Memory Yjs Room Document Pool (Y.Doc per room)                          │
│  - Ephemeral Awareness Broker: live cursors, selections, colors & name tags   │
│  - Continuous Debounced Persistence (1.5s debounce + shutdown flush)          │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                                       │ Atomic Mongoose updates ($set: yjsState, codeState)
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                             MongoDB Storage Layer                             │
│  - InterviewRoom.yjsState (binary CRDT vector update buffer)                  │
│  - InterviewRoom.codeState (plaintext snapshot for search/recovery)           │
│  - InterviewRoom.codeLastSavedAt (high-precision timestamp)                   │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Key Implemented Features

1. **Monaco Editor Integration**:
   - Custom `pairzen-dark` theme matching Pairzen's navy & sky blue design tokens.
   - Syntax highlighting across 7 technical tracks (`typescript`, `javascript`, `python`, `java`, `cpp`, `go`, `rust`).
   - Line numbers, bracket matching, automatic indentation, code folding, and minimap.
   - Built-in starter code templates for each language track.

2. **Yjs CRDT Document Synchronization**:
   - One isolated `Y.Doc` per interview room.
   - Non-destructive concurrent edits: multiple participants can type simultaneously at different locations without race conditions, character loss, or cursor jumping.
   - Custom Next.js 16/Turbopack-compatible `MonacoBinding` that synchronizes changes right-to-left without echo duplication.

3. **Socket.IO Transport & Room Isolation**:
   - Cryptographically authenticated connection handshake via `pz_session` HTTP cookie.
   - Server-enforced room authorization: only the creator or registered participants can enter the room's communication channel.
   - Strict channel isolation: events from `pz_room:A` never leak to `pz_room:B`.
   - Message size validation (<= 1MB updates) and malformed payload rejection.

4. **Ephemeral Participant Presence & Remote Cursors**:
   - Live awareness protocol tracking remote cursor positions and text selections.
   - Dynamic stylesheet generator providing colored caret bars and hoverable name flags for every connected peer.
   - Disconnect cleanup: leaving users are immediately removed from remote editor decorations and active roster.

5. **Durable Persistence & Autosave**:
   - 1500ms debounced autosave to MongoDB avoiding excessive writes.
   - Dual storage format: binary `yjsState` Buffer for CRDT recovery + `codeState` plaintext string for search and export.
   - Immediate flush on room empty (last participant leaves) and on graceful server shutdown (`SIGINT`/`SIGTERM`).
   - Honest save indicator in the UI: distinguishing `Saved`, `Autosaving...`, and `Save failed`.

6. **Lifecycle & Access Control Enforcement**:
   - Completed or cancelled rooms are strictly enforced as **Read-Only** on the server.
   - Any attempt to push edits to a completed room triggers `ROOM_IS_READ_ONLY` rejection.

---

## Workspace UI Structure

The collaborative coding workspace is located at:
`/interviews/[roomId]/workspace`

- **Top Toolbar**: Pairzen logo, room title, room code click-to-copy, live connection badge (`Live Sync` / `Reconnecting` / `Offline` / `Read Only`), autosave status badge, language badge, active participant avatars with cursor color swatches, and "Details" return action.
- **Main Editor**: Full-height Monaco Editor with real-time remote cursors and selection highlights.
- **Right Side Panel**: Collapsible drawer showing connected participants (Host / Candidate / Observer badges with cursor color swatches) and room specifications (difficulty, duration, access policy, status).
- **Bottom Panel**: Collapsible tabbed console:
  - *Console & Output*: Clearly displays that code execution is scheduled for Phase 5.
  - *Sync Diagnostics*: Live metrics on CRDT engine, transport protocol, connected peers count, and cloud autosave timestamp.

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

# Real-Time Collaboration Service
COLLAB_PORT=3001
NEXT_PUBLIC_COLLAB_URL=http://localhost:3001
```

---

## Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Services

In development, Pairzen runs two services:
1. **Next.js Web Application** (Port 3000)
2. **Pairzen Collaboration Engine** (Port 3001)

Open two terminals:

**Terminal 1 (Web App):**
```bash
npm run dev
```

**Terminal 2 (Collaboration Service):**
```bash
npm run collab
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```
Run `npm run collab` alongside `npm run start` in production.

---

## Automated Test Suite

Pairzen uses Node.js's native test runner (`node:test`) and TypeScript via `tsx --test` for fast, reproducible testing against an isolated test database.

```bash
npm run test
```

### Test Suite Results

```
▶ Pairzen Authentication & Authorization Test Suite
  ✔ 1. Password hashing and password verification
  ✔ 2. Successful registration creates user with normalized email
  ✔ 3. Duplicate email registration rejection
  ✔ 4. Successful login verifies credentials
  ✔ 5. Invalid credentials rejection
  ✔ 6. Session creation and validation with hashed tokens
  ✔ 7. Logout and session revocation
  ✔ 8. Protected route behavior: expired or missing token fails
  ✔ 9. Profile update allows permitted fields (name, avatarUrl)
  ✔ 10. Role escalation prevention: client cannot self-assign admin role
  ✔ 11. Invalid request payloads rejected by validation rules
✔ Pairzen Authentication & Authorization Test Suite (11/11 passed)

▶ Pairzen Phase 3: Interview Room Management & Secure Joining
  ✔ 1. Successful room creation with creator as interviewer
  ✔ 2. Invalid room creation payload rejection
  ✔ 3. Duplicate room code collision handling enforces uniqueness
  ✔ 4. Unauthorized room access check for private invite_only room
  ✔ 5. Private room access rejected without valid invitation token
  ✔ 6. Successful invitation-based joining assigns candidate role
  ✔ 7. Revoked invitation token rejects entry
  ✔ 8. Joining the same room twice is idempotent with no duplicates
  ✔ 9. Candidate cannot start an interview (role authorization enforced)
  ✔ 10. Interviewer starts waiting room (waiting -> active)
  ✔ 11. Invalid lifecycle transition rejected
  ✔ 12. Interviewer completes active interview (active -> completed)
  ✔ 13. Cancelled room refuses new participants
  ✔ 14. Dashboard query authorization: users only see authorized rooms
  ✔ 15. Concurrent join requests safety
✔ Pairzen Phase 3: Interview Room Management & Secure Joining (15/15 passed)

▶ Pairzen Phase 4: Real-Time Collaborative Workspace Engine
  ✔ 1. Unauthenticated connection rejection
  ✔ 2. Invalid session token rejection
  ✔ 3. Authorized connection succeeds with valid session
  ✔ 4. Unauthorized room join rejection
  ✔ 5. Authorized interviewer and candidate join with respective roles
  ✔ 6. Room isolation prevents cross-room leakage
  ✔ 7. Real-time document edit synchronization between two clients
  ✔ 8. Concurrent edits converge deterministically via Yjs CRDTs
  ✔ 9. Participant presence and disconnect cleanup
  ✔ 10. State persistence to MongoDB and restoration after server restart
  ✔ 11. Completed or cancelled room editing policy enforces read-only
  ✔ 12. Malformed and oversized update rejection
✔ Pairzen Phase 4: Real-Time Collaborative Workspace Engine (12/12 passed)

Total: 38 passed, 0 failed, 3 suites
```

---

## Horizontal Scaling & Multi-Instance Considerations

- **Single Node (Current Phase)**: In-memory `Y.Doc` sessions with MongoDB persistence. Ideal for development and single-instance deployments.
- **Horizontal Scaling (Production Multi-Instance)**:
  - Add `@socket.io/redis-adapter` so Socket.IO events and room broadcasts route across multiple server instances.
  - Employ a distributed lock or sticky sessions (hash by `roomCode`) so updates for a given interview room route to the same authoritative worker node, or distribute Yjs state updates via Redis Pub/Sub.

---

## Security Highlights

1. **Authentication Verification**: Sockets cannot connect without a valid cryptographic `pz_session` cookie or token.
2. **Room Authorization**: Possession of a room code does not grant workspace access. User membership is validated against MongoDB.
3. **Payload Boundaries**: Maximum update payload size is capped at 1MB to prevent memory exhaustion attacks.
4. **Lifecycle Enforcement**: Closed or cancelled rooms enforce read-only semantics at the protocol layer, not just in UI CSS.
5. **Safe Console**: The bottom output console clearly communicates that code compilation and execution are not available in Phase 4, preventing false expectations.
