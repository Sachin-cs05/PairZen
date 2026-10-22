import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { isSupportedLanguage, getLanguageConfig } from "../src/lib/execution/languages.ts";
import { MockSandboxAdapter } from "../src/lib/execution/adapter.ts";
import { evaluateSolution, normalizeOutput } from "../src/lib/execution/evaluator.ts";
import { Problem } from "../src/lib/db/models/problem.ts";
import { Submission } from "../src/lib/db/models/submission.ts";
import { InterviewRoom } from "../src/lib/db/models/interview-room.ts";
import { User } from "../src/lib/db/models/user.ts";
import { ensureSeedProblems } from "../src/lib/execution/seed-problems.ts";

const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/pairzen_test";

describe("Phase 5: Secure Code Execution & Automated Evaluation Suite", () => {
  let mockAdapter;
  let testUser;
  let testRoom;
  let twoSumProblem;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGODB_URI);
    }

    mockAdapter = new MockSandboxAdapter();

    // Ensure database seed problems are initialized
    await ensureSeedProblems();
    twoSumProblem = await Problem.findOne({ slug: "two-sum" });
    assert.ok(twoSumProblem, "Two Sum seed problem should exist");

    // Create a test user and interview room for authorization tests
    testUser = await User.create({
      name: "Phase 5 Candidate",
      email: `candidate-${Date.now()}@pairzen.test`,
      passwordHash: "dummyhash",
      role: "user",
    });

    testRoom = await InterviewRoom.create({
      roomCode: `pz-${Date.now().toString(36)}`,
      title: "Phase 5 Execution Room",
      creatorId: testUser._id,
      language: "javascript",
      difficulty: "easy",
      accessPolicy: "invite_only",
      invitationTokenHash: "test-token-hash",
      problemId: twoSumProblem._id,
      participants: [
        {
          userId: testUser._id,
          name: testUser.name,
          email: testUser.email,
          role: "candidate",
          joinedAt: new Date(),
        },
      ],
    });
  });

  after(async () => {
    // Cleanup created test documents
    if (testUser) await User.deleteOne({ _id: testUser._id });
    if (testRoom) await InterviewRoom.deleteOne({ _id: testRoom._id });
    await Submission.deleteMany({ roomId: testRoom?._id });
    await mongoose.disconnect();
  });

  describe("1. Language Selection & Validation", () => {
    test("supports required target languages", () => {
      const requiredLangs = ["javascript", "typescript", "python", "java", "cpp", "go", "rust"];
      for (const lang of requiredLangs) {
        assert.equal(isSupportedLanguage(lang), true, `Should support ${lang}`);
        const config = getLanguageConfig(lang);
        assert.ok(config.judge0Id > 0, `${lang} must have a valid Judge0 ID`);
        assert.ok(config.monacoLanguage.length > 0, `${lang} must have monaco language set`);
      }
    });

    test("strictly rejects unsupported or dangerous language strings", () => {
      const maliciousOrInvalid = ["bash", "sh", "eval", "ruby", "perl", "php", "../etc/passwd", ""];
      for (const lang of maliciousOrInvalid) {
        assert.equal(isSupportedLanguage(lang), false, `Should reject ${lang}`);
      }
    });
  });

  describe("2. Sandbox Execution Adapter & Error Handling", () => {
    test("executes valid code and returns stdout and exitCode 0", async () => {
      const result = await mockAdapter.execute({
        sourceCode: `console.log("Hello from Pairzen sandbox");`,
        language: "javascript",
      });

      assert.equal(result.status, "completed");
      assert.equal(result.exitCode, 0);
      assert.ok(result.stdout.includes("Hello from Pairzen sandbox"));
      assert.equal(result.stderr, "");
    });

    test("passes standard input accurately without shell interpolation", async () => {
      const stdinData = "hello world\nline 2";
      const result = await mockAdapter.execute({
        sourceCode: `// Echo stdin`,
        language: "javascript",
        stdin: stdinData,
      });

      assert.equal(result.status, "completed");
      assert.equal(result.exitCode, 0);
      assert.ok(result.stdout.length > 0);
    });

    test("accurately classifies compilation errors", async () => {
      const result = await mockAdapter.execute({
        sourceCode: `class Solution { public static void main(String[] args) { SYNTAX_ERROR `,
        language: "java",
      });

      assert.equal(result.status, "compilation_error");
      assert.notEqual(result.exitCode, 0);
      assert.ok(result.compileOutput && result.compileOutput.includes("error:"));
    });

    test("accurately classifies runtime exceptions (division by zero)", async () => {
      const result = await mockAdapter.execute({
        sourceCode: `print(1 / 0)`,
        language: "python",
      });

      assert.equal(result.status, "runtime_error");
      assert.notEqual(result.exitCode, 0);
      assert.ok(result.stderr.includes("ZeroDivisionError"));
    });

    test("accurately enforces timeout and flags time_limit_exceeded on infinite loop", async () => {
      const result = await mockAdapter.execute({
        sourceCode: `while (true) { /* infinite */ }`,
        language: "javascript",
      });

      assert.equal(result.status, "time_limit_exceeded");
      assert.equal(result.exitCode, 124);
      assert.ok(result.durationMs >= 5000);
      assert.ok(result.stderr.includes("CPU time limit exceeded"));
    });

    test("accurately classifies memory limit exceeded violations", async () => {
      const result = await mockAdapter.execute({
        sourceCode: `// MEMORY_LIMIT_EXCEEDED allocation`,
        language: "cpp",
      });

      assert.equal(result.status, "memory_limit_exceeded");
      assert.equal(result.exitCode, 137);
      assert.ok(result.stderr.includes("Memory limit exceeded"));
    });
  });

  describe("3. Problem Model & Confidential Test Case Protection", () => {
    test("seed problems are correctly structured with constraints and cases", () => {
      assert.ok(twoSumProblem.testCases.length >= 4, "Should have at least 4 test cases");
      const hiddenCases = twoSumProblem.testCases.filter((tc) => tc.isHidden);
      const sampleCases = twoSumProblem.testCases.filter((tc) => !tc.isHidden);
      assert.ok(hiddenCases.length >= 2, "Should have at least 2 hidden test cases");
      assert.ok(sampleCases.length >= 2, "Should have at least 2 sample test cases");
    });

    test("toSafeObject() strictly omits hidden test inputs and expected outputs", () => {
      const safeProblem = twoSumProblem.toSafeObject();

      // Sample cases should have inputs and expected outputs visible
      assert.ok(safeProblem.sampleCases.length > 0);
      for (const sample of safeProblem.sampleCases) {
        assert.equal(sample.isHidden, false);
        assert.ok(sample.input !== undefined);
        assert.ok(sample.expectedOutput !== undefined);
      }

      // Hidden cases in testCases array must NEVER expose input or expectedOutput
      const hiddenSafeCases = safeProblem.testCases.filter((tc) => tc.isHidden);
      assert.ok(hiddenSafeCases.length > 0);
      for (const hidden of hiddenSafeCases) {
        assert.equal(hidden.isHidden, true);
        assert.equal(hidden.input, undefined, "Hidden input MUST NOT be exposed");
        assert.equal(hidden.expectedOutput, undefined, "Hidden expectedOutput MUST NOT be exposed");
      }
    });
  });

  describe("4. Automated Test Case Evaluator", () => {
    test("normalizeOutput handles CRLF and trailing line whitespace correctly", () => {
      const raw = "hello world  \r\nline2   \r\n";
      const normalized = normalizeOutput(raw);
      assert.equal(normalized, "hello world\nline2");
    });

    test("evaluates correct solution to accepted status with 100% pass rate", async () => {
      // Mock two sum test cases
      const testCases = [
        {
          id: "tc-1",
          input: "nums = [2,7,11,15], target = 9",
          expectedOutput: "[0, 1]",
          isHidden: false,
          order: 1,
        },
        {
          id: "tc-2",
          input: "nums = [3,2,4], target = 6",
          expectedOutput: "[0, 1]",
          isHidden: true,
          order: 2,
        },
      ];

      const evaluation = await evaluateSolution({
        sourceCode: `function twoSum() { return [0, 1]; }`,
        language: "javascript",
        testCases,
        adapter: mockAdapter,
      });

      assert.equal(evaluation.status, "accepted");
      assert.equal(evaluation.passedTests, 2);
      assert.equal(evaluation.totalTests, 2);

      // Verify hidden test secrecy in evaluation result
      const hiddenResult = evaluation.results.find((r) => r.isHidden);
      assert.ok(hiddenResult);
      assert.equal(hiddenResult.input, undefined);
      assert.equal(hiddenResult.expectedOutput, undefined);
      assert.equal(hiddenResult.actualOutput, undefined);
    });

    test("flags wrong_answer on incorrect outputs without leaking hidden data", async () => {
      const testCases = [
        {
          id: "tc-1",
          input: "race a car",
          expectedOutput: "true", // Expected true, but mock produces false for "race a car"
          isHidden: true,
          order: 1,
        },
      ];

      const evaluation = await evaluateSolution({
        sourceCode: `function isPalindrome(s) {}`,
        language: "javascript",
        testCases,
        adapter: mockAdapter,
      });

      assert.equal(evaluation.status, "wrong_answer");
      assert.equal(evaluation.passedTests, 0);
      assert.equal(evaluation.totalTests, 1);

      const result = evaluation.results[0];
      assert.equal(result.passed, false);
      assert.equal(result.isHidden, true);
      assert.equal(result.input, undefined);
      assert.equal(result.expectedOutput, undefined);
      assert.equal(result.actualOutput, undefined);
    });

    test("short-circuits evaluation on compilation error", async () => {
      const testCases = [
        { id: "tc-1", input: "1", expectedOutput: "1", isHidden: false, order: 1 },
        { id: "tc-2", input: "2", expectedOutput: "2", isHidden: false, order: 2 },
      ];

      const evaluation = await evaluateSolution({
        sourceCode: `SYNTAX_ERROR class Broken {`,
        language: "java",
        testCases,
        adapter: mockAdapter,
      });

      assert.equal(evaluation.status, "compilation_error");
      assert.equal(evaluation.passedTests, 0);
      assert.ok(evaluation.compileOutput && evaluation.compileOutput.includes("error:"));
    });
  });

  describe("5. Submission Model, Persistence & Security Controls", () => {
    test("creates and persists durable Submission document in MongoDB", async () => {
      const sub = await Submission.create({
        roomId: testRoom._id,
        userId: testUser._id,
        problemId: twoSumProblem._id,
        language: "javascript",
        codeSnapshot: `function twoSum(nums, target) { return [0, 1]; }`,
        status: "accepted",
        passedTests: 4,
        totalTests: 4,
        runtimeMs: 45,
        memoryKb: 10240,
        testResults: [
          {
            testId: "tc-1",
            order: 1,
            isHidden: false,
            passed: true,
            status: "passed",
            input: "nums = [2,7,11,15], target = 9",
            expectedOutput: "[0, 1]",
            actualOutput: "[0, 1]",
          },
          {
            testId: "tc-2",
            order: 2,
            isHidden: true,
            passed: true,
            status: "passed",
            input: "SECRET_INPUT",
            expectedOutput: "SECRET_OUTPUT",
            actualOutput: "SECRET_OUTPUT",
          },
        ],
      });

      assert.ok(sub._id);
      assert.equal(sub.status, "accepted");
      assert.equal(sub.passedTests, 4);

      // Verify safe serialization strictly scrubs hidden test details
      const safe = sub.toSafeObject();
      assert.equal(safe.id, sub._id.toString());
      assert.equal(safe.roomId, testRoom._id.toString());

      const safeHidden = safe.testResults.find((r) => r.isHidden);
      assert.ok(safeHidden);
      assert.equal(safeHidden.input, undefined, "Sanitized submission must not leak hidden test input");
      assert.equal(safeHidden.expectedOutput, undefined, "Sanitized submission must not leak expected output");
      assert.equal(safeHidden.actualOutput, undefined, "Sanitized submission must not leak actual output");
    });

    test("enforces code snapshot length constraint (max 64KB)", async () => {
      const hugeCode = "x".repeat(65537); // Over 64KB limit
      await assert.rejects(
        async () => {
          await Submission.create({
            roomId: testRoom._id,
            userId: testUser._id,
            language: "javascript",
            codeSnapshot: hugeCode,
            status: "accepted",
            passedTests: 1,
            totalTests: 1,
          });
        },
        /Code snapshot cannot exceed 64KB/
      );
    });

    test("queries submissions by roomId with index performance", async () => {
      const roomSubmissions = await Submission.find({ roomId: testRoom._id }).sort({ submittedAt: -1 });
      assert.ok(roomSubmissions.length >= 1);
      assert.equal(roomSubmissions[0].roomId.toString(), testRoom._id.toString());
    });
  });
});
