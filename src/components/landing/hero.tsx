import React from "react";
import { ArrowRight, Code2, Users, Cpu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
      {/* Background ambient gradient accents */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-r from-violet-600/15 via-sky-500/15 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -left-40 w-[420px] h-[420px] bg-violet-700/10 rounded-full blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/4 -right-40 w-[420px] h-[420px] bg-sky-600/10 rounded-full blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/40 px-3.5 py-1 text-xs font-semibold text-violet-300 backdrop-blur-sm mb-6 shadow-sm shadow-violet-900/20">
          <span className="flex h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span>Code together. Think beyond.</span>
          <span className="text-violet-500">/</span>
          <span className="text-slate-300 font-normal">v1.0 Foundation</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-[1.12]">
          Technical interviews,{" "}
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-sky-400 bg-clip-text text-transparent">
            reimagined.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The collaborative coding workspace built for engineering teams. Synchronize code live,
          execute test suites in isolated sandboxes, and run fair, objective candidate assessments.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Button
            href="/dashboard"
            size="lg"
            variant="primary"
            className="w-full sm:w-auto text-base font-semibold shadow-lg shadow-violet-900/30"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Start Interview
          </Button>

          <Button
            href="#preview"
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-base"
          >
            Explore Platform
          </Button>
        </div>

        {/* Architecture Value Pillars */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-8 border-t border-[#1E293B]/70">
          <div className="flex flex-col items-center p-3 rounded-lg bg-[#121A2B]/40 border border-[#1E293B]/60">
            <Users className="w-4 h-4 text-violet-400 mb-1.5" />
            <span className="text-xs font-semibold text-slate-200">Zero-Friction Rooms</span>
            <span className="text-[11px] text-slate-400">One-click candidate link</span>
          </div>

          <div className="flex flex-col items-center p-3 rounded-lg bg-[#121A2B]/40 border border-[#1E293B]/60">
            <Code2 className="w-4 h-4 text-sky-400 mb-1.5" />
            <span className="text-xs font-semibold text-slate-200">Collaborative Sync</span>
            <span className="text-[11px] text-slate-400">Multi-cursor live editor</span>
          </div>

          <div className="flex flex-col items-center p-3 rounded-lg bg-[#121A2B]/40 border border-[#1E293B]/60">
            <Cpu className="w-4 h-4 text-violet-400 mb-1.5" />
            <span className="text-xs font-semibold text-slate-200">Sandboxed Runtime</span>
            <span className="text-[11px] text-slate-400">Multi-language execution</span>
          </div>

          <div className="flex flex-col items-center p-3 rounded-lg bg-[#121A2B]/40 border border-[#1E293B]/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1.5" />
            <span className="text-xs font-semibold text-slate-200">Standardized Scoring</span>
            <span className="text-[11px] text-slate-400">Objective rubrics</span>
          </div>
        </div>
      </div>
    </section>
  );
}
