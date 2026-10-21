"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Code2,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { PairzenLogo, PairzenMark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Interviews",
      icon: <Code2 className="w-4 h-4 shrink-0" />,
      href: "/dashboard#interviews",
      active: false,
    },
    {
      label: "Profile Settings",
      icon: <UserIcon className="w-4 h-4 shrink-0" />,
      href: "/profile",
      active: pathname === "/profile",
    },
    {
      label: "Question Bank",
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
      href: "/dashboard#questions",
      badge: "Phase 3",
      active: false,
    },
    {
      label: "Candidates",
      icon: <Users className="w-4 h-4 shrink-0" />,
      href: "/dashboard#candidates",
      badge: "Phase 3",
      active: false,
    },
    {
      label: "Analytics",
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      href: "/dashboard#analytics",
      badge: "Phase 3",
      active: false,
    },
    {
      label: "Settings",
      icon: <Settings className="w-4 h-4 shrink-0" />,
      href: "/profile",
      active: false,
    },
  ];

  const displayName = user?.name || "Developer";
  const displayRole = user
    ? user.role === "admin"
      ? "Administrator"
      : user.role === "interviewer"
      ? "Technical Interviewer"
      : "Candidate"
    : "Member";

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0E1524] border-r border-[#1E293B] text-slate-300">
      {/* Top Brand Bar */}
      <div>
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#1E293B]">
          {collapsed ? (
            <div className="mx-auto">
              <Link href="/">
                <PairzenMark size={28} />
              </Link>
            </div>
          ) : (
            <PairzenLogo size="md" href="/" />
          )}

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#18233A] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          <div className={cn("text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2", collapsed && "sr-only")}>
            Workspace
          </div>

          <nav className="space-y-1">
            {navItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all group select-none",
                  item.active
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-[#18233A]"
                )}
              >
                <span className={cn(item.active ? "text-violet-400" : "text-slate-400 group-hover:text-slate-200")}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}

                {!collapsed && item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#18233A] border border-[#26334D] text-slate-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Phase 2 Status Banner */}
        {!collapsed && (
          <div className="mx-3 mt-2 rounded-xl bg-[#121A2B] border border-[#1E293B] p-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Phase 2 Auth Active</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              MongoDB user accounts and HTTP-only session cookies are authenticated and persistent.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Profile Section */}
      <div className="border-t border-[#1E293B] p-3">
        {!collapsed ? (
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-[#18233A] transition-colors"
            title="View Profile Settings"
          >
            <Avatar
              name={displayName}
              src={user?.avatarUrl}
              size="md"
              status="online"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {displayRole}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex justify-center py-1">
            <Link href="/profile" title="View Profile">
              <Avatar
                name={displayName}
                src={user?.avatarUrl}
                size="sm"
                status="online"
              />
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-200 h-screen sticky top-0 z-30",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
