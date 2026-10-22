# Pairzen

> **Tagline:** Code together. Think beyond.

Pairzen is a premium, real-time collaborative coding interview platform designed for engineering teams and interviewers. It enables simultaneous multi-cursor pair programming, conflict-free collaborative editing, sandboxed code execution, structured assessment rubrics, and playback telemetry in a sleek, developer-focused environment.

---

## Status & Progress

- **Phase 1: Foundation & Premium UI** — Completed ✅
- **Phase 2: Secure Authentication & User Profiles** — Completed ✅
- **Phase 3: Interview Room Management & Secure Joining** — Completed ✅
- **Phase 4: Real-Time Collaborative Coding Workspace** — Completed ✅
- **Phase 5: Secure Code Execution & Automated Evaluation** — Completed ✅
- **Phase 6: AI Interview Assistant & Intelligent Feedback** — Completed ✅
- **Phase 7: WebRTC Audio/Video & Communication** — Next Phase 🚀

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

▶ Phase 5: Secure Code Execution & Automated Evaluation Suite
  ✔ 1. Language Selection & Validation (2 tests)
  ✔ 2. Sandbox Execution Adapter & Error Handling (6 tests)
  ✔ 3. Problem Model & Confidential Test Case Protection (2 tests)
  ✔ 4. Automated Test Case Evaluator (4 tests)
  ✔ 5. Submission Model, Persistence & Security Controls (3 tests)
✔ Phase 5: Secure Code Execution & Automated Evaluation Suite (17/17 passed)

Total: 55 passed, 0 failed, 4 suites
```

---

## Phase 5: Secure Code Execution & Automated Evaluation

Phase 5 adds an enterprise-grade online judge and automated evaluation subsystem to Pairzen. Candidates and interviewers can run arbitrary code in an isolated sandbox, provide custom standard input, test against problem test suites with normalized comparison, and submit authoritative solutions evaluated against confidential server-side hidden test cases.

### Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│               Pairzen Workspace Frontend               │
│  - Monaco Editor Code Snapshot                         │
│  - Language Selector (7 supported tracks)              │
│  - Stdin Input Console                                 │
│  - Run Code / Run Tests / Submit Solution Controls     │
│  - Stdout, Stderr, Compile Output & Diagnostics Panel   │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ Authenticated JSON API (Cookie / Session)
                            ▼
┌────────────────────────────────────────────────────────┐
│           Next.js API & Authorization Layer            │
│  - POST /api/executions (Custom stdin execution)       │
│  - POST /api/interviews/:roomId/run-tests              │
│  - POST /api/interviews/:roomId/submissions            │
│  - GET  /api/interviews/:roomId/submissions            │
│  - GET  /api/problems & GET /api/problems/:problemId   │
│                                                        │
│  Enforces: Room Membership, Language Whitelisting,     │
│            Payload Bounds (Code <=64KB, Stdin <=16KB)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ IExecutionAdapter abstraction
                            ▼
┌────────────────────────────────────────────────────────┐
│                Execution Adapter Engine                │
│                                                        │
│  [Judge0Adapter]                [MockSandboxAdapter]   │
│  - Remote Judge0 CE Sandbox     - Deterministic local  │
│  - Base64 payload encoding        fallback & tests     │
│  - Non-root, zero network       - Safe simulation      │
│  - Resource limits:             - Zero host execution  │
│    5s CPU, 128MB RAM, 1MB file                         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          MongoDB Models & Evaluation Storage           │
│  - Problem: Title, description, starter code, tests    │
│  - SafeProblem.toSafeObject(): Strips hidden inputs/out│
│  - Submission: Authoritative evaluation snapshot       │
│  - SafeSubmission.toSafeObject(): Confidentially safe  │
└────────────────────────────────────────────────────────┘
```

### Supported Programming Languages

Pairzen centrally validates and configures 7 major language tracks:

| Language | Monaco ID | Judge0 ID | Default Version | File Extension | Mode |
|---|---|---|---|---|---|
| **JavaScript** | `javascript` | 63 | Node.js 20+ | `.js` | Interpreted |
| **TypeScript** | `typescript` | 74 | TypeScript 5.x | `.ts` | Transpiled / Compiled |
| **Python** | `python` | 71 | Python 3.10+ | `.py` | Interpreted |
| **Java** | `java` | 62 | OpenJDK 17 | `.java` | Compiled |
| **C++** | `cpp` | 54 | GCC 11+ | `.cpp` | Compiled |
| **Go** | `go` | 60 | Go 1.20+ | `.go` | Compiled |
| **Rust** | `rust` | 73 | Rust 1.70+ | `.rs` | Compiled |

Arbitrary client-supplied language IDs and unsafe runtimes (such as bash, sh, eval, ruby, or perl) are strictly rejected with HTTP 400 Bad Request.

### Sandbox Isolation & Security Controls

1. **No Application Server Execution**: Untrusted source code is NEVER executed on the Next.js process, Socket.IO server, or developer's host environment. Node `eval`, `new Function`, or shell interpolation are strictly prohibited.
2. **Dedicated Adapter Abstraction (`IExecutionAdapter`)**: Decouples application logic from the underlying sandbox engine. Supports Judge0 Community Edition and a deterministic `MockSandboxAdapter` for tests and offline development.
3. **Resource Restrictions**:
   - CPU Time Limit: 5 seconds (wall clock limit: 15s).
   - Memory Limit: 128 MB (capped at 256 MB max).
   - Maximum Payload Size: Source code <= 64 KB, Stdin <= 16 KB.
   - Network Access: Disabled in sandbox containers.
   - Filesystem: Ephemeral non-root sandboxes destroyed after execution.
4. **Strict Hidden Test Secrecy**:
   - Test cases are partitioned into public sample cases (`isHidden: false`) and evaluation cases (`isHidden: true`).
   - `Problem.toSafeObject()` and `Submission.toSafeObject()` strictly delete and omit `input`, `expectedOutput`, and `actualOutput` for all hidden cases.
   - Candidates receive sanitized statuses (`Passed` or `Failed`), execution duration, and memory metrics, without exposing confidential interview test data.
5. **Normalized Comparisons**: Evaluator normalizes CRLF (`\r\n`) to LF (`\n`) and trims trailing line whitespace to prevent false negatives across diverse platforms while preserving meaningful internal structure.

### Workspace UI Controls

- **Editor Toolbar**:
  - Language selector dropdown synced with room state.
  - `Run Code` button (with custom standard input support).
  - `Run Tests` button (evaluates against problem test suite).
  - `Submit Solution` button (persists authoritative score to MongoDB).
  - Real-time execution status badge (`Accepted`, `Wrong Answer`, `Compile Error`, `Time Limit Exceeded`, `Runtime Error`).
- **Bottom Panel**:
  - `Console & Output`: Toggleable stdin textarea, stdout terminal, stderr highlights, compile errors, exit code, execution duration (ms), and memory (MB).
  - `Test Results`: Overall pass percentage, test case tabs (Case 1, Case 2...), sample test diff view (Input / Expected / Actual), and hidden test confidentiality cards.
  - `Diagnostics`: Real-time Yjs CRDT model, Socket.IO transport, and cloud save state.
- **Sidebar**:
  - `Problem`: Markdown description, constraints, and sample cases.
  - `Peers`: Live participant roster with cursor colors and roles.
  - `Submissions`: Real-time history of evaluated submissions with timestamps, language, and pass rates.

### Running with Judge0 (Optional Production Sandbox)

To connect Pairzen to a local Judge0 Community Edition instance:
```bash
# 1. Start Judge0 via Docker Compose
git clone https://github.com/judge0/judge0.git
cd judge0
docker-compose up -d

# 2. Configure .env.local in Pairzen
JUDGE0_API_URL=http://localhost:2358
USE_MOCK_SANDBOX=false

# 3. Start Pairzen
npm run dev
```

If Judge0 is not running or `USE_MOCK_SANDBOX=true` is set, Pairzen automatically uses the deterministic `MockSandboxAdapter`, ensuring 100% test coverage and offline development without external Docker dependencies.

---

## Phase 6: AI Interview Assistant & Intelligent Feedback

Phase 6 introduces an enterprise-grade AI coding assistant, progressive hint generation, automated code reviews, asymptotic complexity analysis, and durable post-interview evaluation reports grounded exclusively in verified execution evidence.

### Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│               Pairzen Workspace Frontend               │
│  - AI Coding Assistant Panel                           │
│  - 💬 Chat (Code-aware mentoring)                      │
│  - 💡 Progressive Hints (3-Level Guidance Ladder)       │
│  - 🔍 Code Review (Line-by-line issues & strengths)    │
│  - ⚡ Complexity Analysis (Time & Space breakdown)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ Authenticated JSON API (Cookie / Session)
                            ▼
┌────────────────────────────────────────────────────────┐
│              Next.js API & AI Service                  │
│  - POST /api/ai/chat                                   │
│  - POST /api/ai/hints                                  │
│  - POST /api/ai/code-review                            │
│  - POST /api/ai/complexity-analysis                    │
│  - POST & GET /api/interviews/:roomId/feedback         │
│                                                        │
│  Enforces: Room Membership, Prompt Sanitization,       │
│            Hidden Test Secrecy, Payload Bounds         │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ IAIAdapter Abstraction
                            ▼
┌────────────────────────────────────────────────────────┐
│                   AI Provider Layer                    │
│                                                        │
│  [GeminiAIAdapter]  [OpenAIAdapter]  [MockAIAdapter]   │
│  - Google Gemini    - OpenAI-compat  - Deterministic   │
│    v1beta REST        REST endpoint    offline runner  │
│  - Server-only keys - Server-only      for testing &   │
│  - Zero client leak - Zero client leak CI dev          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                  MongoDB Persistence                   │
│  - AIConversation: User-scoped private message history │
│  - InterviewFeedback: Post-interview assessment report │
│    with scores, verified evidence, interviewer notes   │
└────────────────────────────────────────────────────────┘
```

### Core Features

1. **AI Coding Assistant**:
   - Interactive mentor grounded in the candidate's active Monaco source code.
   - Quick prompt shortcuts (`Explain my current code`, `What edge cases should I test?`, `How can I optimize this solution?`).
   - Private conversation isolation: Candidates and interviewers have independent, confidential conversation sessions per room.

2. **Progressive Hint Ladder**:
   - Sequential 3-level progression preventing instant solution disclosure:
     - **Level 1 (Conceptual)**: Core pattern, mathematical invariant, or observation.
     - **Level 2 (Strategic)**: Algorithmic direction and data structure recommendation.
     - **Level 3 (Detailed Guidance)**: Pseudocode and implementation steps.
   - Guarded against skipping: Users must unlock Level 1 before Level 2, and Level 2 before Level 3.

3. **Automated Code Review**:
   - Rigorous structural code review returning validated JSON:
     - Executive summary and confirmed strengths.
     - Potential issues with line numbers, severity (`info`, `warning`, `error`), and actionable suggestions.
     - Potential edge-case vulnerabilities.
     - Complexity summary and confidence notes.
   - Non-destructive: AI advice never modifies the shared Monaco document automatically.

4. **Asymptotic Complexity Analysis**:
   - Big-O analysis: Best, average, and worst-case time complexity.
   - Auxiliary and total space complexity.
   - Loop and recursion breakdown.
   - Documented assumptions (e.g. uniform hash distribution).

5. **Evidence-Grounded Post-Interview Feedback**:
   - Comprehensive assessment report generated for completed interviews.
   - Grounded strictly in verified submissions, test pass percentages, and code structure.
   - Includes rubrics for readability (1-10) and maintainability (1-10).
   - Interviewers can append qualitative notes and save reviews (`PATCH /api/interviews/:roomId/feedback`).
   - **Fairness Guarantee**: Explicitly avoids automated hiring decisions or speculative personality claims.

### Security & Privacy Protections

- **Server-Only Credentials**: Gemini and OpenAI API keys stay strictly on the server and are never bundled into client code.
- **Prompt-Injection Defense**: User messages, code comments, and source snippets are treated as untrusted data enclosed in structured boundaries. Code comments cannot override system instructions or leak hidden tests.
- **Hidden Test Confidentiality**: Hidden test inputs and expected outputs are strictly excluded from AI prompts.
- **Private History Scoping**: User conversations are keyed by `{ roomId, userId }` in MongoDB, preventing cross-candidate data leakage.

### Complete Automated Test Suite (67/67 Tests Passing)

```bash
npm test
```
- **Phase 2 Auth Suite**: 11/11 passed
- **Phase 3 Room Management Suite**: 15/15 passed
- **Phase 4 Collaborative Workspace Suite**: 12/12 passed
- **Phase 5 Code Execution Suite**: 17/17 passed
- **Phase 6 AI Assistant & Feedback Suite**: 12/12 passed
- **Total**: 67 passed, 0 failed across 5 suites.

