import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "offline" | "busy";
  className?: string;
}

export function Avatar({ name, src, size = "md", status, className }: AvatarProps) {
  const sizeStyles = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  };

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold border border-slate-700/60 bg-gradient-to-tr from-[#1E293B] to-[#2D3F5E] text-slate-200 select-none",
          sizeStyles[size]
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              // Fallback to initials if image fails
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-[#0B1020]",
            size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5",
            status === "online" && "bg-emerald-400",
            status === "busy" && "bg-amber-400",
            status === "offline" && "bg-slate-500"
          )}
          aria-label={status}
        />
      )}
    </div>
  );
}
