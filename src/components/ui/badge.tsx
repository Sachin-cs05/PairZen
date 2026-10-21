import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "violet" | "blue" | "success" | "warning" | "danger" | "neutral" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    violet: "bg-violet-950/60 text-violet-300 border-violet-800/50",
    blue: "bg-sky-950/60 text-sky-300 border-sky-800/50",
    success: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50",
    warning: "bg-amber-950/60 text-amber-300 border-amber-800/50",
    danger: "bg-rose-950/60 text-rose-300 border-rose-800/50",
    neutral: "bg-slate-900/80 text-slate-400 border-slate-800",
    outline: "bg-transparent text-slate-300 border-slate-700",
  };

  const dotColors = {
    default: "bg-slate-400",
    violet: "bg-violet-400 animate-pulse",
    blue: "bg-sky-400 animate-pulse",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    neutral: "bg-slate-500",
    outline: "bg-slate-400",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border tracking-wide",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/**
 * Status badge specifically tailored for Interview statuses.
 */
export function StatusBadge({ status }: { status: "scheduled" | "in_progress" | "completed" | "cancelled" }) {
  switch (status) {
    case "in_progress":
      return (
        <Badge variant="violet" dot size="sm">
          Live Now
        </Badge>
      );
    case "scheduled":
      return (
        <Badge variant="blue" dot size="sm">
          Scheduled
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="success" dot size="sm">
          Completed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="neutral" size="sm">
          Cancelled
        </Badge>
      );
  }
}
