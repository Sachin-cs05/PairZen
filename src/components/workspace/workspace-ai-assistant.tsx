"use client";

import React, { useState } from "react";
import {
  Sparkles,
  MessageSquare,
  Lightbulb,
  CheckSquare,
  Cpu,
  Send,
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  ChevronRight,
  Code2,
  Clock,
  Layers,
} from "lucide-react";
import { CodeReviewResult, ComplexityResult, HintResponse } from "@/lib/ai/types";

interface WorkspaceAIAssistantProps {
  roomId: string;
  language: string;
  getCurrentCode: () => string;
}

type AssistantTab = "chat" | "hints" | "review" | "complexity";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function WorkspaceAIAssistant({
  roomId,
  language,
  getCurrentCode,
}: WorkspaceAIAssistantProps) {
  const [activeTab, setActiveTab] = useState<AssistantTab>("chat");

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content:
        "Hello! I am your Pairzen AI coding mentor. Ask me to explain code, brainstorm edge cases, analyze complexity, or provide progressive hints.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Hints State
  const [hints, setHints] = useState<HintResponse[]>([]);
  const [currentHintLevel, setCurrentHintLevel] = useState(0);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  // Code Review State
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Complexity State
  const [complexityResult, setComplexityResult] = useState<ComplexityResult | null>(null);
  const [isLoadingComplexity, setIsLoadingComplexity] = useState(false);
  const [complexityError, setComplexityError] = useState<string | null>(null);

  // Suggested Prompts
  const suggestedPrompts = [
    "Explain my current code",
    "What edge cases should I test?",
    "How can I optimize this solution?",
  ];

  // Send Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputMessage;
    if (!message.trim() || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsSendingChat(true);
    setChatError(null);

    try {
      const codeSnapshot = getCurrentCode();
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          message,
          codeSnapshot,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to communicate with AI");
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI request failed";
      setChatError(msg);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Request Next Progressive Hint
  const handleRequestHint = async () => {
    if (isLoadingHint || currentHintLevel >= 3) return;

    setIsLoadingHint(true);
    setHintError(null);

    try {
      const codeSnapshot = getCurrentCode();
      const res = await fetch("/api/ai/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          requestedLevel: (currentHintLevel + 1) as 1 | 2 | 3,
          codeSnapshot,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch hint");
      }

      setHints((prev) => [...prev, data.hint]);
      setCurrentHintLevel(data.hint.level);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load hint";
      setHintError(msg);
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Run Code Review
  const handleRunCodeReview = async () => {
    if (isLoadingReview) return;

    setIsLoadingReview(true);
    setReviewError(null);

    try {
      const codeSnapshot = getCurrentCode();
      const res = await fetch("/api/ai/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          codeSnapshot: codeSnapshot || "// Empty source",
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Code review failed");
      }

      setReviewResult(data.review);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Review request failed";
      setReviewError(msg);
    } finally {
      setIsLoadingReview(false);
    }
  };

  // Run Complexity Analysis
  const handleRunComplexity = async () => {
    if (isLoadingComplexity) return;

    setIsLoadingComplexity(true);
    setComplexityError(null);

    try {
      const codeSnapshot = getCurrentCode();
      const res = await fetch("/api/ai/complexity-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          codeSnapshot: codeSnapshot || "// Empty source",
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Complexity analysis failed");
      }

      setComplexityResult(data.complexity);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Complexity request failed";
      setComplexityError(msg);
    } finally {
      setIsLoadingComplexity(false);
    }
  };

  return (
    <div className="flex h-full flex-col select-none text-xs">
      {/* Sub-mode navigation bar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-slate-800 bg-[#090d16] px-2 gap-1">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-1 rounded px-2 py-1 transition ${
            activeTab === "chat"
              ? "bg-slate-800 text-sky-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="AI Coding Assistant Chat"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setActiveTab("hints")}
          className={`flex items-center gap-1 rounded px-2 py-1 transition ${
            activeTab === "hints"
              ? "bg-slate-800 text-amber-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Progressive Hints Ladder"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          <span>Hints ({currentHintLevel}/3)</span>
        </button>

        <button
          onClick={() => setActiveTab("review")}
          className={`flex items-center gap-1 rounded px-2 py-1 transition ${
            activeTab === "review"
              ? "bg-slate-800 text-emerald-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Automated Code Review"
        >
          <CheckSquare className="h-3.5 w-3.5" />
          <span>Review</span>
        </button>

        <button
          onClick={() => setActiveTab("complexity")}
          className={`flex items-center gap-1 rounded px-2 py-1 transition ${
            activeTab === "complexity"
              ? "bg-slate-800 text-violet-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Complexity Analysis"
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>Complexity</span>
        </button>
      </div>

      {/* Sub-mode Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* SUB-MODE 1: CHAT */}
        {activeTab === "chat" && (
          <div className="flex h-full flex-col justify-between space-y-3">
            {/* Conversation Stream */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 select-text">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-2.5 leading-relaxed text-xs ${
                    m.role === "user"
                      ? "ml-4 bg-sky-950/40 text-sky-100 border border-sky-800/40"
                      : "mr-4 bg-slate-900/60 text-slate-200 border border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[10px] text-slate-400 mb-1">
                    {m.role === "assistant" ? (
                      <span className="flex items-center gap-1 text-violet-400">
                        <Sparkles className="h-3 w-3" /> Pairzen AI Mentor
                      </span>
                    ) : (
                      <span className="text-sky-400">You</span>
                    )}
                  </div>
                  <div className="whitespace-pre-line">{m.content}</div>
                </div>
              ))}

              {isSendingChat && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-900/40 p-2.5 text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                  <span>Pairzen AI is thinking...</span>
                </div>
              )}

              {chatError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2 text-rose-300">
                  {chatError}
                </div>
              )}
            </div>

            {/* Suggested Prompts */}
            <div className="space-y-1.5 pt-1">
              <div className="flex flex-wrap gap-1">
                {suggestedPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(p)}
                    disabled={isSendingChat}
                    className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400 hover:text-sky-300 border border-slate-800 transition"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Chat Input Box */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask Pairzen AI about code or concepts..."
                  disabled={isSendingChat}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-900/90 py-2 pl-3 pr-8 text-xs text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isSendingChat || !inputMessage.trim()}
                  className="absolute right-1.5 p-1 text-slate-400 hover:text-violet-400 disabled:opacity-40 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODE 2: PROGRESSIVE HINTS */}
        {activeTab === "hints" && (
          <div className="space-y-3 select-text">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span>Progressive Hint Ladder</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Request hints in 3 calibrated stages without spoiling the complete solution:
                Level 1 (Concept) → Level 2 (Strategy) → Level 3 (Guidance).
              </p>
            </div>

            {/* Hint Progress Indicator */}
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-1">
              <span>Unlocked: {currentHintLevel} / 3 Levels</span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((lvl) => (
                  <span
                    key={lvl}
                    className={`h-2 w-6 rounded-full transition ${
                      lvl <= currentHintLevel ? "bg-amber-400" : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Unlocked Hints Display */}
            <div className="space-y-2.5">
              {hints.map((h) => (
                <div
                  key={h.level}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-amber-400">{h.title}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-500">
                      Level {h.level}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-slate-300 leading-relaxed pt-1 font-sans">
                    {h.content}
                  </p>
                </div>
              ))}
            </div>

            {hintError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2 text-rose-300">
                {hintError}
              </div>
            )}

            {/* Next Hint Action Button */}
            {currentHintLevel < 3 ? (
              <button
                onClick={handleRequestHint}
                disabled={isLoadingHint}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 transition"
              >
                {isLoadingHint ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                ) : (
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                )}
                <span>Request Level {currentHintLevel + 1} Hint</span>
              </button>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-2.5 text-center text-slate-500 text-[11px]">
                All 3 progressive hints unlocked for this problem.
              </div>
            )}
          </div>
        )}

        {/* SUB-MODE 3: CODE REVIEW */}
        {activeTab === "review" && (
          <div className="space-y-3 select-text">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Automated Code Review</span>
              <button
                onClick={handleRunCodeReview}
                disabled={isLoadingReview}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 transition"
              >
                {isLoadingReview ? (
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                ) : (
                  <CheckSquare className="h-3 w-3 text-emerald-400" />
                )}
                <span>Review Code</span>
              </button>
            </div>

            {reviewError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2 text-rose-300">
                {reviewError}
              </div>
            )}

            {isLoadingReview && (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                <span>Analyzing code structure, patterns, and complexity...</span>
              </div>
            )}

            {reviewResult && !isLoadingReview && (
              <div className="space-y-3">
                {/* Summary */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5 text-slate-300 leading-relaxed font-sans">
                  <span className="text-[11px] font-semibold text-emerald-400 block mb-0.5">
                    Summary:
                  </span>
                  {reviewResult.summary}
                </div>

                {/* Strengths */}
                {reviewResult.strengths?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Strengths
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                      {reviewResult.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Potential Issues */}
                {reviewResult.issues?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-400" /> Potential Issues
                    </span>
                    <div className="space-y-1.5">
                      {reviewResult.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="rounded border border-slate-800 bg-slate-900/60 p-2 space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            {typeof issue.line === "number" && (
                              <span className="font-mono text-sky-400">Line {issue.line}</span>
                            )}
                            <span
                              className={`rounded px-1.5 py-0.2 uppercase font-semibold ${
                                issue.severity === "error"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : issue.severity === "warning"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-sky-500/20 text-sky-400"
                              }`}
                            >
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-slate-200">{issue.description}</p>
                          <p className="text-[11px] text-slate-400 italic">
                            Suggestion: {issue.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complexity Summary */}
                {reviewResult.complexity && (
                  <div className="flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Time:</span>
                      <span className="font-mono text-violet-300 font-semibold">
                        {reviewResult.complexity.time}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Space:</span>
                      <span className="font-mono text-violet-300 font-semibold">
                        {reviewResult.complexity.space}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!reviewResult && !isLoadingReview && (
              <div className="text-center py-6 text-slate-500">
                Click &quot;Review Code&quot; to inspect your current implementation for best practices, edge cases, and improvements.
              </div>
            )}
          </div>
        )}

        {/* SUB-MODE 4: COMPLEXITY ANALYSIS */}
        {activeTab === "complexity" && (
          <div className="space-y-3 select-text">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Asymptotic Complexity</span>
              <button
                onClick={handleRunComplexity}
                disabled={isLoadingComplexity}
                className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 hover:bg-violet-500/20 disabled:opacity-50 transition"
              >
                {isLoadingComplexity ? (
                  <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                ) : (
                  <Cpu className="h-3 w-3 text-violet-400" />
                )}
                <span>Analyze Complexity</span>
              </button>
            </div>

            {complexityError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2 text-rose-300">
                {complexityError}
              </div>
            )}

            {isLoadingComplexity && (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                <span>Computing asymptotic bounds across loops and recursion...</span>
              </div>
            )}

            {complexityResult && !isLoadingComplexity && (
              <div className="space-y-3">
                {/* Time Complexity Card */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 uppercase tracking-wider">
                    <Clock className="h-3 w-3" /> Time Complexity
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
                    <div className="rounded bg-slate-900 p-1">
                      <span className="text-[10px] text-slate-500 block">Best</span>
                      <span className="text-slate-200 font-semibold">
                        {complexityResult.timeComplexity.best}
                      </span>
                    </div>
                    <div className="rounded bg-slate-900 p-1 border border-violet-500/30">
                      <span className="text-[10px] text-violet-400 block font-sans">Average</span>
                      <span className="text-violet-200 font-semibold">
                        {complexityResult.timeComplexity.average}
                      </span>
                    </div>
                    <div className="rounded bg-slate-900 p-1">
                      <span className="text-[10px] text-slate-500 block">Worst</span>
                      <span className="text-slate-200 font-semibold">
                        {complexityResult.timeComplexity.worst}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1">
                    {complexityResult.timeComplexity.explanation}
                  </p>
                </div>

                {/* Space Complexity Card */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                    <Layers className="h-3 w-3" /> Space Complexity
                  </div>
                  <div className="grid grid-cols-2 gap-2 py-1 font-mono text-center">
                    <div className="rounded bg-slate-900 p-1 border border-sky-500/30">
                      <span className="text-[10px] text-sky-400 block font-sans">Auxiliary</span>
                      <span className="text-sky-200 font-semibold">
                        {complexityResult.spaceComplexity.auxiliary}
                      </span>
                    </div>
                    <div className="rounded bg-slate-900 p-1">
                      <span className="text-[10px] text-slate-500 block">Total</span>
                      <span className="text-slate-200 font-semibold">
                        {complexityResult.spaceComplexity.total}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1">
                    {complexityResult.spaceComplexity.explanation}
                  </p>
                </div>

                {/* Breakdown details */}
                {complexityResult.loopAndRecursionBreakdown?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Execution Loop Analysis:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[11px]">
                      {complexityResult.loopAndRecursionBreakdown.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!complexityResult && !isLoadingComplexity && (
              <div className="text-center py-6 text-slate-500">
                Click &quot;Analyze Complexity&quot; to determine asymptotic time and auxiliary memory bounds.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
