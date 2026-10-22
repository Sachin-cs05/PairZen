import { ITestCase } from "../db/models/problem";
import { ITestEvaluationResult, SubmissionStatus } from "../db/models/submission";
import { IExecutionAdapter, ExecutionResult } from "./adapter";
import { SupportedLanguage } from "./languages";

export interface EvaluationSummary {
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtimeMs?: number;
  memoryKb?: number;
  results: ITestEvaluationResult[];
  compileOutput?: string;
  errorMessage?: string;
}

/**
 * Normalizes output strings for robust comparison across platforms and environments.
 * Normalizes CRLF -> LF and trims trailing whitespace on each line.
 */
export function normalizeOutput(output: string): string {
  return output
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Evaluates source code against a collection of test cases.
 * Strictly guarantees that hidden test inputs and expected outputs are never exposed.
 */
export async function evaluateSolution(options: {
  sourceCode: string;
  language: SupportedLanguage;
  testCases: ITestCase[];
  adapter: IExecutionAdapter;
  timeoutMs?: number;
}): Promise<EvaluationSummary> {
  const { sourceCode, language, testCases, adapter, timeoutMs = 5000 } = options;

  const results: ITestEvaluationResult[] = [];
  let passedCount = 0;
  let maxDurationMs = 0;
  let maxMemoryKb = 0;
  let hasCompilationError = false;
  let hasTimeLimit = false;
  let hasRuntimeError = false;
  let compilationMessage: string | undefined;

  // Sort test cases by order
  const sortedCases = [...testCases].sort((a, b) => a.order - b.order);

  for (const tc of sortedCases) {
    // If compilation error was already detected, short-circuit remaining tests
    if (hasCompilationError) {
      results.push({
        testId: tc.id,
        order: tc.order,
        isHidden: tc.isHidden,
        passed: false,
        status: "compilation_error",
        errorMessage: tc.isHidden ? undefined : "Compilation error encountered",
      });
      continue;
    }

    const execResult: ExecutionResult = await adapter.execute({
      sourceCode,
      language,
      stdin: tc.input,
      expectedOutput: tc.expectedOutput,
      timeoutMs,
    });

    if (execResult.durationMs && execResult.durationMs > maxDurationMs) {
      maxDurationMs = execResult.durationMs;
    }
    if (execResult.memoryKb && execResult.memoryKb > maxMemoryKb) {
      maxMemoryKb = execResult.memoryKb;
    }

    // Check for compilation failure
    if (execResult.status === "compilation_error") {
      hasCompilationError = true;
      compilationMessage = execResult.compileOutput || execResult.stderr || "Compilation failed";
      results.push({
        testId: tc.id,
        order: tc.order,
        isHidden: tc.isHidden,
        passed: false,
        status: "compilation_error",
        durationMs: execResult.durationMs,
        memoryKb: execResult.memoryKb,
        errorMessage: tc.isHidden ? undefined : compilationMessage,
      });
      continue;
    }

    // Check for timeout
    if (execResult.status === "time_limit_exceeded") {
      hasTimeLimit = true;
      results.push({
        testId: tc.id,
        order: tc.order,
        isHidden: tc.isHidden,
        passed: false,
        status: "time_limit_exceeded",
        durationMs: execResult.durationMs,
        memoryKb: execResult.memoryKb,
        errorMessage: tc.isHidden ? undefined : "Time limit exceeded",
      });
      continue;
    }

    // Check for runtime error
    if (execResult.status === "runtime_error" || execResult.exitCode !== 0) {
      hasRuntimeError = true;
      results.push({
        testId: tc.id,
        order: tc.order,
        isHidden: tc.isHidden,
        passed: false,
        status: "runtime_error",
        durationMs: execResult.durationMs,
        memoryKb: execResult.memoryKb,
        errorMessage: tc.isHidden ? undefined : execResult.stderr || "Runtime error occurred",
      });
      continue;
    }

    // Verify output correctness using normalized comparison
    const actualNorm = normalizeOutput(execResult.stdout);
    const expectedNorm = normalizeOutput(tc.expectedOutput);
    const passed = actualNorm === expectedNorm;

    if (passed) {
      passedCount++;
    }

    // Construct test result object with strict hidden confidentiality
    if (tc.isHidden) {
      results.push({
        testId: tc.id,
        order: tc.order,
        isHidden: true,
        passed,
        status: passed ? "passed" : "wrong_answer",
        durationMs: execResult.durationMs,
        memoryKb: execResult.memoryKb,
        errorMessage: passed ? undefined : "Hidden test case failed",
      });
    } else {
      results.push({
        testId: tc.id,
        order: tc.order,
        isHidden: false,
        passed,
        status: passed ? "passed" : "wrong_answer",
        durationMs: execResult.durationMs,
        memoryKb: execResult.memoryKb,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: execResult.stdout,
        errorMessage: passed ? undefined : "Output did not match expected output",
      });
    }
  }

  // Determine overall evaluation status
  let overallStatus: SubmissionStatus = "accepted";
  if (hasCompilationError) {
    overallStatus = "compilation_error";
  } else if (hasTimeLimit && passedCount < sortedCases.length) {
    overallStatus = "time_limit_exceeded";
  } else if (hasRuntimeError && passedCount < sortedCases.length) {
    overallStatus = "runtime_error";
  } else if (passedCount === sortedCases.length && sortedCases.length > 0) {
    overallStatus = "accepted";
  } else {
    overallStatus = "wrong_answer";
  }

  return {
    status: overallStatus,
    passedTests: passedCount,
    totalTests: sortedCases.length,
    runtimeMs: maxDurationMs,
    memoryKb: maxMemoryKb,
    results,
    compileOutput: compilationMessage,
  };
}
