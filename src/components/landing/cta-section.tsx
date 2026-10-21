import React from "react";
import { ArrowRight, Sparkles, Terminal, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCtaSection() {
  return (
    <section id="architecture" className="py-20 border-t border-[#1E293B] bg-[#0B1020] relative overflow-hidden">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Architecture Spec Card */}
        <div className="rounded-2xl border border-[#26334D] bg-[#121A2B] p-8 md:p-12 mb-16 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-950/60 border border-violet-800/40 px-3 py-1 text-xs font-semibold text-violet-300 mb-4">
                <Terminal className="w-3.5 h-3.5" />
                <span>Architecture Blueprint</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
                Built on a modern full-stack foundation.
              </h2>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Phase 1 establishes a rock-solid design system, strict TypeScript models, and Next.js App Router architecture primed for Socket.IO real-time clusters, MongoDB data persistence, and Monaco Editor integration.
              </p>

              <div className="mt-6 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Phase 1: Foundation, UI System & Design Tokens</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Phase 2 (Upcoming): Socket.IO Synchronizer & Monaco Integration</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Phase 3 (Upcoming): MongoDB Cluster, Node API & Execution Worker</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-5 font-mono text-xs text-slate-300 space-y-2">
              <div className="text-slate-500">{"// Stack Manifest"}</div>
              <div className="text-slate-400">
                <span className="text-purple-400">const</span> stack = &#123;
              </div>
              <div className="pl-4 text-slate-300">
                framework: <span className="text-emerald-300">&quot;Next.js 16 App Router&quot;</span>,
              </div>
              <div className="pl-4 text-slate-300">
                language: <span className="text-emerald-300">&quot;TypeScript Strict&quot;</span>,
              </div>
              <div className="pl-4 text-slate-300">
                styling: <span className="text-emerald-300">&quot;Tailwind CSS v4 + Design Tokens&quot;</span>,
              </div>
              <div className="pl-4 text-slate-300">
                state: <span className="text-emerald-300">&quot;Server Components + Client Shell&quot;</span>,
              </div>
              <div className="pl-4 text-slate-300">
                realtimeReady: <span className="text-violet-400">true</span>,
              </div>
              <div className="text-slate-400">&#125;;</div>
            </div>
          </div>
        </div>

        {/* Final CTA Box */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Elevate your engineering hiring bar today.
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base">
            Join forward-thinking engineering organizations who conduct technical screens candidates actually enjoy.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="/dashboard"
              size="lg"
              variant="primary"
              className="w-full sm:w-auto text-base font-semibold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Dashboard
            </Button>
            <Button
              href="#preview"
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base"
              leftIcon={<Sparkles className="w-4 h-4 text-violet-400" />}
            >
              Try Interactive Preview
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
