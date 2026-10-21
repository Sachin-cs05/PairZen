"use client";

import React, { useState } from "react";
import {
  Play,
  CheckCircle2,
  Terminal,
  FileCode2,
  Users2,
  Wifi,
  Sparkles,
  Volume2,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProductPreview() {
  const [activeTab, setActiveTab] = useState<"editor" | "tests">("editor");
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
      setActiveTab("tests");
    }, 700);
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="preview" className="relative py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-8">
          <Badge variant="violet" size="sm" className="mb-2">
            Interactive Workspace Preview
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Real-time synchronization. Zero friction.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl mx-auto">
            Experience dual cursors, instant compile feedback, and live presence in one unified interface.
          </p>
        </div>

        {/* IDE Outer Window */}
        <div className="relative rounded-2xl border border-[#26334D] bg-[#0E1524] shadow-2xl shadow-black/80 overflow-hidden">
          {/* Top Window Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] bg-[#121A2B] px-4 py-3">
            {/* macOS-style Window Buttons + Room Info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="h-4 w-px bg-[#1E293B] hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-200">
                  room/pz-9482-arch
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live 24:18
                </span>
              </div>
            </div>

            {/* Active Collaborators Pills */}
            <div className="flex items-center gap-2">
              {/* Alex (Interviewer) */}
              <div className="flex items-center gap-1.5 rounded-full bg-violet-950/80 border border-violet-700/60 px-2.5 py-0.5 text-xs text-violet-200">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                <span className="font-medium">Alex (Interviewer)</span>
                <Volume2 className="w-3 h-3 text-violet-400 ml-0.5" />
              </div>

              {/* Sarah (Candidate) */}
              <div className="flex items-center gap-1.5 rounded-full bg-sky-950/80 border border-sky-700/60 px-2.5 py-0.5 text-xs text-sky-200">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="font-medium">Sarah (Candidate)</span>
              </div>

              {/* Ping / Latency Indicator */}
              <div className="hidden md:flex items-center gap-1 text-slate-400 text-[11px] pl-2 border-l border-[#1E293B]">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>18ms</span>
              </div>
            </div>

            {/* Run / Action Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="hidden sm:inline-flex text-xs h-8"
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? "Copied" : "Invite Link"}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleRunCode}
                isLoading={isRunning}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/40 text-white"
                leftIcon={!isRunning && <Play className="w-3.5 h-3.5 fill-current" />}
              >
                Run Tests
              </Button>
            </div>
          </div>

          {/* IDE Main Layout: Left Problem Statement (Desktop) + Right Code Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
            {/* Left Column: Problem Brief */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-[#0B1020]/90 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Challenge 01
                  </span>
                  <Badge variant="violet" size="sm">
                    Medium • 20m
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">
                  High-Throughput LRU Event Cache
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Implement an in-memory event cache with $O(1)$ read and write performance, supporting TTL-based expiration and capacity eviction.
                </p>

                <div className="space-y-3">
                  <div className="rounded-lg bg-[#121A2B] border border-[#1E293B] p-3">
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Function Signature:
                    </span>
                    <code className="text-xs font-mono text-violet-300 block">
                      class EventCache&lt;T&gt; &#123; ... &#125;
                    </code>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <span className="font-medium text-slate-300 block">Constraints:</span>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      <span>Capacity $N \le 100,000$ items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      <span>Zero-allocation hot-path lookups</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rubric Evaluation Snippet */}
              <div className="mt-6 pt-4 border-t border-[#1E293B]">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 text-violet-400" />
                    Interviewer Notes:
                  </span>
                  <span className="text-emerald-400 font-medium">Clear communication</span>
                </div>
              </div>
            </div>

            {/* Right Column: Code Editor & Execution Panel */}
            <div className="lg:col-span-8 flex flex-col bg-[#0B1020]">
              {/* Tab Bar */}
              <div className="flex items-center justify-between border-b border-[#1E293B] bg-[#0E1524] px-3">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("editor")}
                    className={`flex items-center gap-2 border-r border-[#1E293B] px-4 py-2.5 text-xs font-medium transition-colors ${
                      activeTab === "editor"
                        ? "bg-[#0B1020] text-violet-300 border-t-2 border-t-violet-500"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
                    event-cache.ts
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("tests")}
                    className={`flex items-center gap-2 border-r border-[#1E293B] px-4 py-2.5 text-xs font-medium transition-colors ${
                      activeTab === "tests"
                        ? "bg-[#0B1020] text-violet-300 border-t-2 border-t-violet-500"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    test-results.log
                    {hasRun && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
                  TypeScript 5.6 • Node 22 Sandbox
                </div>
              </div>

              {/* Editor Code Area */}
              {activeTab === "editor" ? (
                <div className="relative flex-1 p-4 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto select-none bg-[#0B1020]">
                  {/* Line numbers + code */}
                  <div className="flex">
                    {/* Line numbers */}
                    <div className="pr-4 text-slate-600 select-none text-right font-mono text-xs space-y-0.5">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>

                    {/* Syntax Highlighted Code */}
                    <div className="flex-1 space-y-0.5 text-slate-200">
                      <div>
                        <span className="text-purple-400">export class</span>{" "}
                        <span className="text-yellow-300">EventCache</span>
                        <span className="text-slate-400">&lt;</span>
                        <span className="text-sky-300">T</span>
                        <span className="text-slate-400">&gt;</span>{" "}
                        <span className="text-slate-400">&#123;</span>
                      </div>

                      <div className="pl-4">
                        <span className="text-purple-400">private</span>{" "}
                        <span className="text-sky-300">capacity</span>
                        <span className="text-slate-400">: </span>
                        <span className="text-emerald-400">number</span>
                        <span className="text-slate-400">;</span>
                      </div>

                      <div className="pl-4">
                        <span className="text-purple-400">private</span>{" "}
                        <span className="text-sky-300">map</span>
                        <span className="text-slate-400"> = </span>
                        <span className="text-purple-400">new</span>{" "}
                        <span className="text-yellow-300">Map</span>
                        <span className="text-slate-400">&lt;</span>
                        <span className="text-emerald-400">string</span>
                        <span className="text-slate-400">, </span>
                        <span className="text-sky-300">T</span>
                        <span className="text-slate-400">&gt;();</span>
                      </div>

                      <div className="pl-4">
                        <span className="text-purple-400">constructor</span>
                        <span className="text-slate-400">(</span>
                        <span className="text-sky-300">capacity</span>
                        <span className="text-slate-400">: </span>
                        <span className="text-emerald-400">number</span>
                        <span className="text-slate-400">) &#123;</span>
                      </div>

                      <div className="pl-8">
                        <span className="text-purple-400">this</span>
                        <span className="text-slate-400">.</span>
                        <span className="text-sky-300">capacity</span>
                        <span className="text-slate-400"> = </span>
                        <span className="text-sky-300">capacity</span>
                        <span className="text-slate-400">;</span>
                      </div>

                      <div className="pl-4">
                        <span className="text-slate-400">&#125;</span>
                      </div>

                      {/* Sarah's Live Editing Line with Sky Cursor */}
                      <div className="pl-4 relative inline-block w-full bg-sky-950/20 rounded py-0.5">
                        <span className="text-purple-400">public</span>{" "}
                        <span className="text-yellow-300">get</span>
                        <span className="text-slate-400">(</span>
                        <span className="text-sky-300">key</span>
                        <span className="text-slate-400">: </span>
                        <span className="text-emerald-400">string</span>
                        <span className="text-slate-400">): </span>
                        <span className="text-sky-300">T</span>{" "}
                        <span className="text-purple-400">|</span>{" "}
                        <span className="text-yellow-400">null</span>{" "}
                        <span className="text-slate-400">&#123;</span>
                        {/* Sarah's Cursor */}
                        <span className="relative inline-block w-0.5 h-4 bg-sky-400 ml-0.5 align-middle animate-pulse">
                          <span className="absolute -top-6 -left-2 bg-sky-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded shadow whitespace-nowrap">
                            Sarah Chen
                          </span>
                        </span>
                      </div>

                      <div className="pl-8">
                        <span className="text-purple-400">if</span>{" "}
                        <span className="text-slate-400">(!</span>
                        <span className="text-purple-400">this</span>
                        <span className="text-slate-400">.</span>
                        <span className="text-sky-300">map</span>
                        <span className="text-slate-400">.</span>
                        <span className="text-yellow-300">has</span>
                        <span className="text-slate-400">(</span>
                        <span className="text-sky-300">key</span>
                        <span className="text-slate-400">)) </span>
                        <span className="text-purple-400">return</span>{" "}
                        <span className="text-yellow-400">null</span>
                        <span className="text-slate-400">;</span>
                      </div>

                      <div className="pl-8">
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-sky-300">val</span>
                        <span className="text-slate-400"> = </span>
                        <span className="text-purple-400">this</span>
                        <span className="text-slate-400">.</span>
                        <span className="text-sky-300">map</span>
                        <span className="text-slate-400">.</span>
                        <span className="text-yellow-300">get</span>
                        <span className="text-slate-400">(</span>
                        <span className="text-sky-300">key</span>
                        <span className="text-slate-400">)!;</span>
                      </div>

                      {/* Alex's Reviewer Cursor (Violet) */}
                      <div className="pl-8 relative inline-block w-full bg-violet-950/20 rounded py-0.5">
                        <span className="text-purple-400">this</span>
                        <span className="text-slate-400">.</span>
                        <span className="text-sky-300">map</span>
                        <span className="text-slate-400">.</span>
                        <span className="text-yellow-300">delete</span>
                        <span className="text-slate-400">(</span>
                        <span className="text-sky-300">key</span>
                        <span className="text-slate-400">); </span>
                        <span className="text-slate-500">{"// refresh LRU order"}</span>
                        {/* Alex's Cursor */}
                        <span className="relative inline-block w-0.5 h-4 bg-violet-400 ml-0.5 align-middle animate-pulse">
                          <span className="absolute -top-6 -left-2 bg-violet-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded shadow whitespace-nowrap">
                            Alex (Interviewer)
                          </span>
                        </span>
                      </div>

                      <div className="pl-8">
                        <span className="text-purple-400">this</span>
                        <span className="text-slate-400">.</span>
                        <span className="text-sky-300">map</span>
                        <span className="text-slate-400">.</span>
                        <span className="text-yellow-300">set</span>
                        <span className="text-slate-400">(</span>
                        <span className="text-sky-300">key</span>
                        <span className="text-slate-400">, </span>
                        <span className="text-sky-300">val</span>
                        <span className="text-slate-400">);</span>
                      </div>

                      <div className="pl-8">
                        <span className="text-purple-400">return</span>{" "}
                        <span className="text-sky-300">val</span>
                        <span className="text-slate-400">;</span>
                      </div>

                      <div className="pl-4">
                        <span className="text-slate-400">&#125;</span>
                      </div>

                      <div>
                        <span className="text-slate-400">&#125;</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Test Output Terminal Tab */
                <div className="flex-1 p-5 font-mono text-xs bg-[#090D1A] overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 text-slate-400">
                    <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      All Test Cases Passed (3 / 3)
                    </span>
                    <span className="text-slate-400">Execution time: 14.2ms</span>
                  </div>

                  <div className="space-y-2 pt-1 text-slate-300">
                    <div className="flex items-center justify-between rounded bg-[#121A2B] px-3 py-2 border border-[#1E293B]">
                      <span className="text-emerald-300 font-medium">✓ Test 1: Instantiation & Capacity Eviction</span>
                      <span className="text-slate-400 text-[11px]">3ms</span>
                    </div>
                    <div className="flex items-center justify-between rounded bg-[#121A2B] px-3 py-2 border border-[#1E293B]">
                      <span className="text-emerald-300 font-medium">✓ Test 2: O(1) Cache Hits & Refresh Order</span>
                      <span className="text-slate-400 text-[11px]">4ms</span>
                    </div>
                    <div className="flex items-center justify-between rounded bg-[#121A2B] px-3 py-2 border border-[#1E293B]">
                      <span className="text-emerald-300 font-medium">✓ Test 3: High-Concurrency Burst (10,000 items)</span>
                      <span className="text-slate-400 text-[11px]">7.2ms</span>
                    </div>
                  </div>

                  <div className="pt-2 text-slate-400 text-[11px]">
                    Memory: 18.4 MB • CPU: 0.8% • Exit Code: 0 (Clean)
                  </div>
                </div>
              )}

              {/* Bottom Footer Status Bar */}
              <div className="flex items-center justify-between border-t border-[#1E293B] bg-[#0E1524] px-4 py-2 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-violet-300">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    Pairzen Engine v1.0
                  </span>
                  <span>UTF-8</span>
                  <span>Spaces: 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Sockets Synced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
