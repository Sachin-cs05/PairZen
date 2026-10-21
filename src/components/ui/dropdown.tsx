"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({ trigger, children, align = "right", className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            "absolute z-40 mt-2 min-w-[200px] rounded-xl bg-[#121A2B] border border-[#26334D] p-1.5 shadow-xl shadow-black/40",
            "animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  icon,
  danger = false,
  disabled = false,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors",
        danger
          ? "text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
          : "text-slate-200 hover:bg-[#1E293B] hover:text-white",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {icon && <span className="w-4 h-4 shrink-0 text-slate-400">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-[#1E293B]" role="separator" />;
}
