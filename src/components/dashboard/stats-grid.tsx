import React from "react";
import {
  Code2,
  CheckCircle2,
  CalendarClock,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { DashboardStats } from "@/types/interview";

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const cards = [
    {
      title: "Total Interviews",
      value: stats.totalInterviews.value,
      badge: `+${stats.totalInterviews.changePercentage}%`,
      subtext: "vs. previous 30 days",
      icon: <Code2 className="w-5 h-5 text-violet-400" />,
      accent: "violet",
    },
    {
      title: "Completed Sessions",
      value: stats.completedSessions.value,
      badge: `${stats.completedSessions.completionRatePercentage}%`,
      subtext: "completion success rate",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      accent: "emerald",
    },
    {
      title: "Upcoming Interviews",
      value: stats.upcomingInterviews.value,
      badge: `In ${stats.upcomingInterviews.nextInMinutes}m`,
      subtext: "next candidate waiting",
      icon: <CalendarClock className="w-5 h-5 text-sky-400" />,
      accent: "sky",
    },
    {
      title: "Avg. Duration",
      value: `${stats.averageDuration.valueMinutes}m`,
      badge: `Target ${stats.averageDuration.targetMinutes}m`,
      subtext: "ideal pacing benchmark",
      icon: <Timer className="w-5 h-5 text-purple-400" />,
      accent: "purple",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className="bg-[#121A2B] border-[#1E293B] hover:border-[#26334D] transition-colors p-5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {card.title}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#18233A] border border-[#26334D]">
              {card.icon}
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {card.value}
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-950/60 text-violet-300 border border-violet-800/40">
              {card.badge}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            <span>{card.subtext}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
