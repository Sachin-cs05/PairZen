"use client";

import React, { useState } from "react";
import {
  Zap,
  BookOpen,
  Award,
  Activity,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onCreateInterview: () => void;
}

export function QuickActions({ onCreateInterview }: QuickActionsProps) {
  const [activeModal, setActiveModal] = useState<{
    title: string;
    description: string;
    phase: string;
  } | null>(null);

  const actions = [
    {
      title: "Instant Room",
      description: "Spin up a temporary scratchpad room with zero setup.",
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      onClick: onCreateInterview,
    },
    {
      title: "Question Library",
      description: "Browse 80+ curated technical algorithm & system design prompts.",
      icon: <BookOpen className="w-5 h-5 text-violet-400" />,
      onClick: () =>
        setActiveModal({
          title: "Question Bank & Templates",
          description:
            "Curated algorithmic problems, architecture whiteboard challenges, and frontend tasks with automated test cases.",
          phase: "Phase 2 Roadmap: Question bank database & custom question authoring.",
        }),
    },
    {
      title: "Evaluation Rubrics",
      description: "Standardized scoring criteria for candidate competency reviews.",
      icon: <Award className="w-5 h-5 text-emerald-400" />,
      onClick: () =>
        setActiveModal({
          title: "Standardized Evaluation Rubrics",
          description:
            "Calibrated scoring guides covering Problem Solving, Code Quality, Systems Thinking, and Communication.",
          phase: "Phase 2 Roadmap: Rubric builder and hiring committee exports.",
        }),
    },
    {
      title: "System Diagnostics",
      description: "Check WebSocket cluster health, compiler latencies & runtime status.",
      icon: <Activity className="w-5 h-5 text-sky-400" />,
      onClick: () =>
        setActiveModal({
          title: "System Health & Telemetry",
          description:
            "All Phase 1 frontend modules, token systems, and mock stores are operating normally.",
          phase: "Phase 3 Roadmap: Distributed Redis/Socket.IO multi-region mesh diagnostics.",
        }),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act, idx) => (
          <Card
            key={idx}
            variant="interactive"
            onClick={act.onClick}
            className="p-4 bg-[#121A2B] border-[#1E293B] group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18233A] border border-[#26334D] group-hover:scale-105 transition-transform">
                {act.icon}
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
            </div>

            <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
              {act.title}
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {act.description}
            </p>
          </Card>
        ))}
      </div>

      {/* Informational Modal for deferred features */}
      {activeModal && (
        <Dialog
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={activeModal.title}
          description="Feature Scope Notice"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              {activeModal.description}
            </p>

            <div className="rounded-lg bg-sky-950/40 border border-sky-800/40 p-3.5 text-sky-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Architectural Scope:</span>
                <span>{activeModal.phase}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#1E293B]">
              <Button variant="primary" size="sm" onClick={() => setActiveModal(null)}>
                Understood
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
