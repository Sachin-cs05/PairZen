"use client";

import React, { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { CreateInterviewModal } from "@/components/dashboard/create-interview-modal";
import { JoinInterviewModal } from "@/components/dashboard/join-interview-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#0B1020] text-slate-100">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <DashboardSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <DashboardHeader
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onCreateInterview={() => setCreateModalOpen(true)}
          onJoinInterview={() => setJoinModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>

      {/* Global Modals for Header Actions */}
      <CreateInterviewModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
      <JoinInterviewModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </div>
  );
}
