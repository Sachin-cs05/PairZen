import React from "react";
import { PlusCircle, Code, Award, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function LandingHowItWorks() {
  const steps = [
    {
      step: "01",
      icon: <PlusCircle className="w-5 h-5 text-violet-400" />,
      title: "Create or Schedule Session",
      description:
        "Select an engineering track, pick challenge templates from your question bank, and generate a secure candidate interview room in one click.",
      meta: "No setup required for candidates",
    },
    {
      step: "02",
      icon: <Code className="w-5 h-5 text-sky-400" />,
      title: "Live Collaborative Solving",
      description:
        "Code together in real-time with dual-cursor tracking, run test suites against isolated compilers, and discuss architectural trade-offs naturally.",
      meta: "Full multi-cursor & audio support",
    },
    {
      step: "03",
      icon: <Award className="w-5 h-5 text-emerald-400" />,
      title: "Standardized Evaluation",
      description:
        "Review automatic execution telemetry, replay the session timeline, and record calibrated competency scores for your hiring committee.",
      meta: "Objective, bias-free records",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-t border-[#1E293B]/60 bg-[#0E1524]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="violet" size="sm" className="mb-3">
            Simple 3-Step Flow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            How Pairzen streamlines interviews.
          </h2>
          <p className="mt-4 text-base text-slate-400">
            From session creation to hiring committee review, designed to minimize friction and maximize technical signal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="relative rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 hover:border-[#334155] transition-colors"
            >
              {/* Step Number Indicator */}
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-3xl font-extrabold text-slate-600/70">
                  {item.step}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18233A] border border-[#26334D]">
                  {item.icon}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-100 mb-2">
                {item.title}
              </h3>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {item.description}
              </p>

              <div className="pt-4 border-t border-[#1E293B] text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span>{item.meta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mid-journey CTA */}
        <div className="mt-14 text-center">
          <Button
            href="/dashboard"
            size="md"
            variant="outline"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Explore Dashboard Experience
          </Button>
        </div>
      </div>
    </section>
  );
}
