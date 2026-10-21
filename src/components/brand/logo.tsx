import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  iconOnly?: boolean;
  withTagline?: boolean;
  href?: string;
}

const sizeConfig = {
  sm: { icon: 22, text: "text-lg", tagline: "text-[10px]" },
  md: { icon: 28, text: "text-xl", tagline: "text-xs" },
  lg: { icon: 36, text: "text-2xl", tagline: "text-xs" },
  xl: { icon: 44, text: "text-3xl", tagline: "text-sm" },
};

export function PairzenMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pz-violet" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="pz-blue" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="pz-glow" x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Subtle outer rounded container */}
      <rect x="2" y="2" width="36" height="36" rx="9" fill="#121A2B" stroke="#1E293B" strokeWidth="1.5" />
      
      {/* Background ambient glow inside the badge */}
      <circle cx="20" cy="20" r="10" fill="url(#pz-glow)" filter="blur(4px)" />

      {/* Left Code Bracket (Collaborator 1 - Violet) */}
      <path
        d="M16 13L10.5 19.2C10.15 19.6 10.15 20.4 10.5 20.8L16 27"
        stroke="url(#pz-violet)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Code Bracket (Collaborator 2 - Blue) */}
      <path
        d="M24 13L29.5 19.2C29.85 19.6 29.85 20.4 29.5 20.8L24 27"
        stroke="url(#pz-blue)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Zen Bridge / Slash connection */}
      <path
        d="M22 14.5L18 25.5"
        stroke="#94A3B8"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Active Sync Pulse Dots */}
      <circle cx="20" cy="20" r="1.5" fill="#38BDF8" />
    </svg>
  );
}

export function PairzenLogo({
  className,
  size = "md",
  iconOnly = false,
  withTagline = false,
  href = "/",
}: LogoProps) {
  const cfg = sizeConfig[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group", className)}>
      <PairzenMark size={cfg.icon} className="transition-transform duration-200 group-hover:scale-105" />
      {!iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center tracking-tight font-semibold leading-none">
            <span className={cn("text-slate-100 font-bold tracking-tight", cfg.text)}>
              Pair
            </span>
            <span
              className={cn(
                "bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent font-extrabold tracking-tight",
                cfg.text
              )}
            >
              zen
            </span>
            <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-violet-400" />
          </div>
          {withTagline && (
            <span className={cn("text-slate-400 font-medium tracking-wide mt-0.5", cfg.tagline)}>
              Code together. Think beyond.
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
