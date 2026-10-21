"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { CreateInterviewModal } from "@/components/dashboard/create-interview-modal";
import { JoinInterviewModal } from "@/components/dashboard/join-interview-modal";
import { useAuth } from "@/context/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1020] text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Validating Pairzen session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return null;
  }

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
