"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Camera,
  LogOut,
} from "lucide-react";
import { PairzenLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { SafeUser } from "@/lib/db/models/user";
import { formatDate } from "@/lib/utils";

interface ProfileContentProps {
  user: SafeUser;
  updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

function ProfileContent({ user, updateProfile, logout }: ProfileContentProps) {
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const result = await updateProfile({
      name: name.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    setIsSaving(false);

    if (result.success) {
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3500);
    } else {
      setErrorMessage(result.error || "Failed to update profile.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100 selection:bg-violet-600/30">
      {/* Top Navigation */}
      <header className="border-b border-[#1E293B] bg-[#0E1524] px-4 sm:px-8 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <PairzenLogo size="md" href="/dashboard" />
          <div className="flex items-center gap-3">
            <Button
              href="/dashboard"
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-400 hover:text-rose-400"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 sm:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            Account &amp; Profile Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your personal credentials, workspace presence, and role permissions.
          </p>
        </div>

        {/* Feedback alerts */}
        {successMessage && (
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-4 text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl bg-rose-950/40 border border-rose-800/40 p-4 text-xs text-rose-300 flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: User Card */}
          <div className="rounded-2xl border border-[#26334D] bg-[#121A2B] p-6 space-y-6 flex flex-col items-center text-center">
            <div className="relative group">
              <Avatar
                name={user.name}
                src={user.avatarUrl}
                size="lg"
                status="online"
                className="w-20 h-20 text-xl ring-4 ring-violet-500/20"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100">{user.name}</h2>
              <p className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
                {user.email}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge
                variant={
                  user.role === "admin"
                    ? "danger"
                    : user.role === "interviewer"
                    ? "violet"
                    : "blue"
                }
                size="sm"
              >
                {user.role === "admin"
                  ? "Administrator"
                  : user.role === "interviewer"
                  ? "Interviewer"
                  : "Candidate"}
              </Badge>
              <Badge variant="success" size="sm" dot>
                Active
              </Badge>
            </div>

            <div className="w-full pt-4 border-t border-[#1E293B] space-y-2.5 text-left text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Member since {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-violet-400" />
                <span>Session: Persistent HTTP-only</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editable Profile Form */}
          <div className="md:col-span-2 rounded-2xl border border-[#26334D] bg-[#121A2B] p-6 sm:p-8">
            <h3 className="text-base font-semibold text-slate-100 mb-6 pb-3 border-b border-[#1E293B]">
              Edit Profile Details
            </h3>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Full Name */}
              <Input
                label="Display Name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              {/* Email (Read Only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Email Address (Verified)
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-lg bg-[#0B1020]/60 border border-[#1E293B] pl-10 pr-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Email address changes require identity verification in Phase 3.
                </p>
              </div>

              {/* Avatar URL */}
              <Input
                label="Avatar Image URL (Optional)"
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                helperText="Leave empty to use your initials automatically."
              />

              {/* Role Protection Notice */}
              <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Shield className="w-4 h-4 text-violet-400" />
                  <span>Role Authorization: {user.role.toUpperCase()}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Roles are strictly enforced on the server and cannot be elevated through user profile edits.
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-[#1E293B] flex items-center justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, updateProfile, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/profile");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1020] text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ProfileContent key={user.id} user={user} updateProfile={updateProfile} logout={logout} />;
}
