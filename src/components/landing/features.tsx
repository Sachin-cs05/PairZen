import React from "react";
import {
  Code,
  Share2,
  Terminal,
  ClipboardCheck,
  Zap,
  Lock,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function LandingFeatures() {
  const coreFeatures = [
    {
      icon: <Code className="w-6 h-6 text-violet-400" />,
      accent: "violet",
      badge: "Realtime Engine",
      title: "Real-time Collaborative Coding",
      description:
        "Sub-millisecond synchronization built for live pair programming. Experience synchronized dual cursors, selection broadcasting, and seamless editor state without lockups or dropped keystrokes.",
      points: [
        "Multi-cursor presence with distinct color tags",
        "Deterministic conflict resolution (OT/CRDT)",
        "Zero-latency typing feedback",
      ],
    },
    {
      icon: <Share2 className="w-6 h-6 text-sky-400" />,
      accent: "blue",
      badge: "Room Orchestration",
      title: "Shared Interview Rooms",
      description:
        "Generate disposable, enterprise-secure interview links in seconds. Candidate joins instantly in browser without logins, software installations, or configuration steps.",
      points: [
        "One-click candidate access links",
        "Configurable role permissions & observer mode",
        "Preloaded starter templates & questions",
      ],
    },
    {
      icon: <Terminal className="w-6 h-6 text-emerald-400" />,
      accent: "emerald",
      badge: "Sandboxed Runtimes",
      title: "Safe Code Execution",
      description:
        "Run code against automated test cases in hardened, ephemeral Docker/gVisor sandboxes. Support multiple languages with instant stdout, stderr, memory, and runtime metrics.",
      points: [
        "First-class TypeScript, Python, Go, Java & Rust",
        "Automated custom test case evaluation",
        "Rigorous compute quotas and isolation",
      ],
    },
    {
      icon: <ClipboardCheck className="w-6 h-6 text-purple-400" />,
      accent: "purple",
      badge: "Fair Assessment",
      title: "Interview Feedback & History",
      description:
        "Standardize candidate assessments with calibrated rubrics, private timestamped notes, and full session timeline playback so hiring committees make data-driven decisions.",
      points: [
        "Structured competency scorecards",
        "Timeline replay of candidate code progression",
        "Centralized team feedback archives",
      ],
    },
  ];

  return (
    <section id="features" className="py-20 border-t border-[#1E293B]/60 bg-[#0B1020]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="blue" size="sm" className="mb-3">
            Core Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Engineered for genuine technical evaluation.
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Everything your engineering team needs to conduct rigorous, respectful, and insightful coding screens.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coreFeatures.map((feat, idx) => (
            <Card
              key={idx}
              className="relative overflow-hidden bg-[#121A2B] border-[#1E293B] hover:border-[#334155] p-7 transition-all duration-200 group"
            >
              {/* Top ambient highlight on hover */}
              <div className="pointer-events-none absolute -top-24 -right-24 w-48 h-48 bg-violet-600/10 rounded-full blur-2xl group-hover:bg-violet-600/20 transition-colors" />

              <div className="flex items-center justify-between mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#18233A] border border-[#26334D] shadow-inner">
                  {feat.icon}
                </div>
                <Badge variant="neutral" size="sm">
                  {feat.badge}
                </Badge>
              </div>

              <h3 className="text-xl font-bold text-slate-100 mb-2.5">
                {feat.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {feat.description}
              </p>

              <div className="space-y-2 border-t border-[#1E293B]/70 pt-4">
                {feat.points.map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Secondary Capability Pillars */}
        <div className="mt-12 rounded-2xl bg-[#0E1524] border border-[#1E293B] p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-start gap-4">
              <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Sub-20ms Latency</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Global edge mesh websockets ensure snappy responses across continents.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Enterprise Security</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Ephemeral memory isolation, zero data leaks, and SOC2-ready architecture.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Layers className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Monaco Core</h4>
                <p className="text-xs text-slate-400 mt-1">
                  The trusted VS Code engine with auto-complete, diagnostics, and syntax highlighting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
