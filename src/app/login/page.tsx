"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Info,
} from "lucide-react";
import { PairzenLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/dashboard";

  // Prevent open redirect attacks: only allow internal relative paths starting with /
  const redirectTarget =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/dashboard";

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    const result = await login({
      email: email.trim().toLowerCase(),
      password,
      rememberMe,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Invalid email or password.");
    } else {
      router.push(redirectTarget);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 relative z-10">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <PairzenLogo size="lg" href="/" className="justify-center" />
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 pt-3">
          Welcome back
        </h1>
        <p className="text-sm text-slate-400">
          Sign in to your technical interview dashboard.
        </p>
      </div>

      {/* Card Form */}
      <div className="rounded-2xl border border-[#26334D] bg-[#121A2B] p-6 sm:p-8 shadow-2xl shadow-black/60">
        {error && (
          <div className="mb-6 rounded-lg bg-rose-950/40 border border-rose-800/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address */}
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoFocus
          />

          {/* Password */}
          <div className="space-y-1">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[#1E293B] bg-[#0B1020] text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
              />
              <span>Remember me (30 days)</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotPasswordModalOpen(true)}
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-4 font-semibold shadow-lg shadow-violet-900/30"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>
      </div>

      {/* Footer Link */}
      <p className="text-center text-xs text-slate-400">
        Don&apos;t have a Pairzen account yet?{" "}
        <Link
          href="/register"
          className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
        >
          Create one now
        </Link>
      </p>

      {/* Forgot Password Modal */}
      {forgotPasswordModalOpen && (
        <Dialog
          isOpen={true}
          onClose={() => setForgotPasswordModalOpen(false)}
          title="Password Recovery"
          description="Account Security Notice"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Automated email password reset delivery via SMTP/Resend is scheduled for Phase 3.
            </p>
            <div className="rounded-lg bg-sky-950/40 border border-sky-800/40 p-3.5 text-sky-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Phase 2 Notice:</span>
                <span>
                  For local development, you can register a new account or reset your password directly via MongoDB.
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-[#1E293B]">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setForgotPasswordModalOpen(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#0B1020] text-slate-100 relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/15 rounded-full blur-[100px]"
        aria-hidden="true"
      />
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading sign-in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
