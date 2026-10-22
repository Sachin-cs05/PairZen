"use client";

import { useState } from "react";
import {
  Terminal,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Trash2,
  Lock,
  Loader2,
  Cpu,
} from "lucide-react";
import { CollabConnectionStatus, CollabSaveStatus } from "@/lib/collab/use-collab-room";
import { ExecutionResult } from "@/lib/execution/adapter";
import { EvaluationSummary } from "@/lib/execution/evaluator";

interface WorkspaceBottomPanelProps {
  connectionStatus: CollabConnectionStatus;
  saveStatus: CollabSaveStatus;
  lastSavedAt: string | null;
  activeParticipantCount: number;
  language: string;
  // Execution State
  stdin: string;
  onStdinChange: (val: string) => void;
  isExecuting?: boolean;
  executionResult: ExecutionResult | null;
  onClearOutput: () => void;
  // Test Evaluation State
  isTesting?: boolean;
  evaluationSummary: EvaluationSummary | null;
  activeTab: "console" | "tests" | "diagnostics";
  onTabChange: (tab: "console" | "tests" | "diagnostics") => void;
}

export function WorkspaceBottomPanel({
  connectionStatus,
  saveStatus,
  lastSavedAt,
  activeParticipantCount,
  language,
  stdin,
  onStdinChange,
  isExecuting,
  executionResult,
  onClearOutput,
  isTesting,
  evaluationSummary,
  activeTab,
  onTabChange,
}: WorkspaceBottomPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showStdin, setShowStdin] = useState(false);
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);

  const selectedTest = evaluationSummary?.results?.[selectedTestCaseIndex];

  return (
    <div
      className={`border-t border-slate-800 bg-[#0c121e] transition-all duration-200 select-none flex flex-col ${
        isCollapsed ? "h-9" : "h-64 sm:h-72"
      }`}
    >
      {/* Tab Navigation Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-slate-800/80 px-4">
        <div className="flex items-center gap-1">
          {/* Console Tab */}
          <button
            onClick={() => {
              onTabChange("console");
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "console" && !isCollapsed
                ? "border-b-2 border-sky-400 text-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Console & Output</span>
            {executionResult && (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  executionResult.exitCode === 0 && executionResult.status === "completed"
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                }`}
              />
            )}
          </button>

          {/* Test Results Tab */}
          <button
            onClick={() => {
              onTabChange("tests");
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "tests" && !isCollapsed
                ? "border-b-2 border-sky-400 text-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Test Results</span>
            {evaluationSummary && (
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                  evaluationSummary.status === "accepted"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {evaluationSummary.passedTests}/{evaluationSummary.totalTests}
              </span>
            )}
          </button>

          {/* Diagnostics Tab */}
          <button
            onClick={() => {
              onTabChange("diagnostics");
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "diagnostics" && !isCollapsed
                ? "border-b-2 border-sky-400 text-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Diagnostics</span>
          </button>
        </div>

        {/* Right header controls */}
        <div className="flex items-center gap-2">
          {activeTab === "console" && (
            <>
              <button
                onClick={() => setShowStdin(!showStdin)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                  showStdin
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                Stdin {stdin ? `(${stdin.length}b)` : ""}
              </button>

              {executionResult && (
                <button
                  onClick={onClearOutput}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition"
                  title="Clear output"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-slate-200 transition"
            title={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Tab Body */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
          {/* TAB 1: CONSOLE & EXECUTION OUTPUT */}
          {activeTab === "console" && (
            <div className="space-y-3">
              {/* Optional Custom Stdin Textarea */}
              {showStdin && (
                <div className="rounded-lg border border-slate-800 bg-[#090d16] p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-sky-400">Standard Input (stdin)</span>
                    <span>{stdin.length} / 16384 chars</span>
                  </div>
                  <textarea
                    value={stdin}
                    onChange={(e) => onStdinChange(e.target.value)}
                    maxLength={16384}
                    placeholder="Enter custom input passed to standard input during Run Code..."
                    rows={3}
                    className="w-full resize-y rounded border border-slate-700/80 bg-slate-900/60 p-2 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}

              {/* Running Spinner */}
              {isExecuting && (
                <div className="flex items-center gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-sky-300">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                  <span>Executing code in isolated sandbox runner...</span>
                </div>
              )}

              {/* Execution Results Display */}
              {executionResult ? (
                <div className="space-y-2.5">
                  {/* Result Metrics Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 font-semibold">
                        {executionResult.status === "completed" && executionResult.exitCode === 0 ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Success
                          </span>
                        ) : executionResult.status === "time_limit_exceeded" ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> Time Limit Exceeded
                          </span>
                        ) : executionResult.status === "compilation_error" ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Compile Error
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> Error
                          </span>
                        )}
                      </span>

                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">Exit Code: {executionResult.exitCode}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      {typeof executionResult.durationMs === "number" && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          {executionResult.durationMs}ms
                        </span>
                      )}
                      {typeof executionResult.memoryKb === "number" && (
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3 text-slate-500" />
                          {(executionResult.memoryKb / 1024).toFixed(1)}MB
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compile Output (if any) */}
                  {executionResult.compileOutput && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5">
                      <span className="text-[11px] font-semibold text-amber-400 block mb-1">
                        Compilation Diagnostic:
                      </span>
                      <pre className="whitespace-pre-wrap text-amber-200 text-xs font-mono select-text">
                        {executionResult.compileOutput}
                      </pre>
                    </div>
                  )}

                  {/* Standard Error (if any) */}
                  {executionResult.stderr && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5">
                      <span className="text-[11px] font-semibold text-rose-400 block mb-1">
                        Standard Error (stderr):
                      </span>
                      <pre className="whitespace-pre-wrap text-rose-200 text-xs font-mono select-text">
                        {executionResult.stderr}
                      </pre>
                    </div>
                  )}

                  {/* Standard Output */}
                  <div className="rounded-lg border border-slate-800 bg-[#090d16] p-2.5">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Standard Output (stdout):
                    </span>
                    {executionResult.stdout ? (
                      <pre className="whitespace-pre-wrap text-slate-100 text-xs font-mono select-text leading-relaxed">
                        {executionResult.stdout}
                      </pre>
                    ) : (
                      <span className="text-slate-600 italic">No output produced.</span>
                    )}
                  </div>
                </div>
              ) : !isExecuting ? (
                <div className="text-slate-400 select-text space-y-1">
                  <div>
                    <span className="text-emerald-400 font-semibold">[pairzen]</span> Ready for execution ({language.toUpperCase()}).
                  </div>
                  <div className="text-slate-500">
                    Click <span className="text-sky-300 font-semibold">Run Code</span> to test execution with standard input, or <span className="text-emerald-300 font-semibold">Run Tests</span> to evaluate against problem cases.
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: TEST RESULTS */}
          {activeTab === "tests" && (
            <div className="space-y-3">
              {isTesting && (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-emerald-300">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <span>Evaluating code against authoritative test cases...</span>
                </div>
              )}

              {evaluationSummary ? (
                <div className="space-y-3">
                  {/* Summary Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          evaluationSummary.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {evaluationSummary.status === "accepted" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        <span className="capitalize">{evaluationSummary.status.replace("_", " ")}</span>
                      </span>

                      <span className="text-xs font-semibold text-slate-200">
                        {evaluationSummary.passedTests} of {evaluationSummary.totalTests} tests passed (
                        {Math.round((evaluationSummary.passedTests / (evaluationSummary.totalTests || 1)) * 100)}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {typeof evaluationSummary.runtimeMs === "number" && (
                        <span>Runtime: {evaluationSummary.runtimeMs}ms</span>
                      )}
                      {typeof evaluationSummary.memoryKb === "number" && (
                        <span>Memory: {(evaluationSummary.memoryKb / 1024).toFixed(1)}MB</span>
                      )}
                    </div>
                  </div>

                  {/* Compilation Error Notice if any */}
                  {evaluationSummary.compileOutput && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5 text-amber-200 text-xs">
                      <div className="font-semibold text-amber-400 mb-1">Compilation Failure:</div>
                      <pre className="whitespace-pre-wrap">{evaluationSummary.compileOutput}</pre>
                    </div>
                  )}

                  {/* Test Cases Selector Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {evaluationSummary.results.map((res, idx) => (
                      <button
                        key={res.testId || idx}
                        onClick={() => setSelectedTestCaseIndex(idx)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition shrink-0 ${
                          selectedTestCaseIndex === idx
                            ? "border-sky-500/50 bg-sky-500/10 text-sky-200"
                            : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            res.passed ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        <span>Case {idx + 1}</span>
                        {res.isHidden && (
                          <span title="Hidden Test">
                            <Lock className="h-3 w-3 text-slate-500" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Selected Test Detail */}
                  {selectedTest && (
                    <div className="rounded-lg border border-slate-800 bg-[#090d16] p-3 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">
                            Test Case #{selectedTestCaseIndex + 1}
                          </span>
                          {selectedTest.isHidden ? (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700">
                              <Lock className="h-2.5 w-2.5" /> Hidden Test
                            </span>
                          ) : (
                            <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400 border border-sky-500/20">
                              Sample Test
                            </span>
                          )}
                        </div>

                        <span
                          className={`font-semibold ${
                            selectedTest.passed ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {selectedTest.passed ? "Passed" : "Failed"}
                        </span>
                      </div>

                      {/* Confidentiality Notice for Hidden Tests */}
                      {selectedTest.isHidden ? (
                        <div className="rounded border border-slate-800 bg-slate-900/30 p-2.5 text-xs text-slate-400 leading-relaxed">
                          <div className="flex items-center gap-1.5 font-medium text-slate-300 mb-1">
                            <Lock className="h-3 w-3 text-sky-400" />
                            Confidential Evaluation Case
                          </div>
                          Input and expected output for hidden evaluation tests are protected server-side to maintain interview integrity.
                          {selectedTest.errorMessage && (
                            <div className="mt-1 text-rose-400">{selectedTest.errorMessage}</div>
                          )}
                        </div>
                      ) : (
                        /* Visible Test Inputs & Outputs */
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Input:</span>
                            <pre className="rounded bg-slate-900/80 p-2 text-slate-200 border border-slate-800 select-text overflow-x-auto">
                              {selectedTest.input}
                            </pre>
                          </div>

                          <div>
                            <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Expected Output:</span>
                            <pre className="rounded bg-slate-900/80 p-2 text-slate-200 border border-slate-800 select-text overflow-x-auto">
                              {selectedTest.expectedOutput}
                            </pre>
                          </div>

                          <div>
                            <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Actual Output:</span>
                            <pre
                              className={`rounded p-2 border select-text overflow-x-auto ${
                                selectedTest.passed
                                  ? "bg-emerald-950/20 text-emerald-200 border-emerald-500/30"
                                  : "bg-rose-950/20 text-rose-200 border-rose-500/30"
                              }`}
                            >
                              {selectedTest.actualOutput || "<no output>"}
                            </pre>
                          </div>

                          {selectedTest.errorMessage && (
                            <div className="text-xs text-rose-400 font-medium">
                              Note: {selectedTest.errorMessage}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : !isTesting ? (
                <div className="text-slate-400 py-2">
                  No evaluation run yet. Click <span className="text-emerald-300 font-semibold">Run Tests</span> or <span className="text-violet-300 font-semibold">Submit</span> in the toolbar to test your solution.
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: DIAGNOSTICS */}
          {activeTab === "diagnostics" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="rounded border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-slate-500 block text-[11px]">CRDT Sync Engine</span>
                <span className="text-slate-200 font-semibold mt-1 inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Yjs Document Model
                </span>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-slate-500 block text-[11px]">Transport Protocol</span>
                <span className="text-slate-200 font-semibold mt-1 block capitalize">
                  Socket.IO ({connectionStatus})
                </span>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-slate-500 block text-[11px]">Active Room Peers</span>
                <span className="text-slate-200 font-semibold mt-1 block">
                  {activeParticipantCount} connected
                </span>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-slate-500 block text-[11px]">Durable Cloud Save</span>
                <span className="text-slate-200 font-semibold mt-1 block truncate">
                  {saveStatus === "saved" && lastSavedAt
                    ? new Date(lastSavedAt).toLocaleTimeString()
                    : saveStatus}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
