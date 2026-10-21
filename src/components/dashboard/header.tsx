"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  Plus,
  User,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onCreateInterview: () => void;
  onJoinInterview: () => void;
  onSearchChange?: (query: string) => void;
}

export function DashboardHeader({
  onOpenMobileSidebar,
  onCreateInterview,
  onJoinInterview,
  onSearchChange,
}: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const displayName = user?.name || "Developer";
  const displayEmail = user?.email || "developer@pairzen.io";
  const displayRole = user
    ? user.role === "admin"
      ? "Administrator"
      : user.role === "interviewer"
      ? "Interviewer"
      : "Candidate"
    : "Member";

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#1E293B] bg-[#0B1020]/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Left Area: Mobile hamburger toggle & Search input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#18233A] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search interviews, candidates, tags..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-lg bg-[#121A2B] border border-[#1E293B] pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Right Area: Actions, Notification Center & Profile Dropdown */}
      <div className="flex items-center gap-2.5">
        {/* Join button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onJoinInterview}
          className="hidden md:inline-flex text-xs h-8"
        >
          Join Room
        </Button>

        {/* Primary Create Interview Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onCreateInterview}
          className="text-xs h-8 font-semibold shadow-sm shadow-violet-900/30"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Interview
        </Button>

        <div className="h-4 w-px bg-[#1E293B] mx-1 hidden sm:block" />

        {/* Notification Affordance */}
        <Dropdown
          align="right"
          className="w-80 p-0"
          trigger={
            <button
              type="button"
              className="relative rounded-lg p-2 text-slate-400 hover:text-slate-100 hover:bg-[#121A2B] transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                </span>
              )}
            </button>
          }
        >
          <div className="flex items-center justify-between p-3.5 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-violet-400 hover:text-violet-300 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[#1E293B]/60">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 text-xs transition-colors hover:bg-[#18233A]/50 ${
                  !notif.read ? "bg-violet-950/20" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-slate-200">{notif.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{notif.timeAgo}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">{notif.message}</p>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-[#1E293B] text-center">
            <span className="text-[11px] text-slate-400">
              Live updates active
            </span>
          </div>
        </Dropdown>

        {/* Profile Menu Dropdown */}
        <Dropdown
          align="right"
          className="w-56"
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg p-1 hover:bg-[#121A2B] transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-label="User menu"
            >
              <Avatar
                name={displayName}
                src={user?.avatarUrl}
                size="sm"
                status="online"
              />
            </button>
          }
        >
          <div className="px-3 py-2 border-b border-[#1E293B]">
            <p className="text-xs font-semibold text-slate-200">{displayName}</p>
            <p className="text-[11px] text-slate-400 truncate">{displayEmail}</p>
            <span className="mt-1 inline-block text-[10px] text-violet-400 font-medium">
              {displayRole}
            </span>
          </div>

          <div className="py-1">
            <DropdownItem
              icon={<User className="w-3.5 h-3.5" />}
              onClick={() => router.push("/profile")}
            >
              Profile Settings
            </DropdownItem>
            <DropdownItem
              icon={<Settings className="w-3.5 h-3.5" />}
              onClick={() => router.push("/profile")}
            >
              Account Preferences
            </DropdownItem>
            <DropdownItem
              icon={<HelpCircle className="w-3.5 h-3.5" />}
              onClick={() => window.open("https://github.com", "_blank")}
            >
              Documentation
            </DropdownItem>
          </div>

          <DropdownSeparator />

          <DropdownItem
            danger
            icon={<LogOut className="w-3.5 h-3.5" />}
            onClick={logout}
          >
            Sign Out
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
