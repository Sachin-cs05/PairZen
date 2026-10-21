"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  Check,
  AlertCircle,
} from "lucide-react";
import { PairzenLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { getPasswordStrength } from "@/lib/auth/schemas";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [role, setRole] = useState<"user" | "interviewer">("user");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client validation
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!termsAccepted) {
      setError("Please accept the terms and privacy policy to continue.");
      return;
    }

    setIsLoading(true);

    const result = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
      role,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to create account. Please try again.");
    } else {
      router.push("/dashboard");
    }
  };

  const strengthColors = {
    0: "bg-slate-700",
    1: "bg-rose-500",
    2: "bg-amber-500",
    3: "bg-sky-400",
    4: "bg-emerald-400",
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#0B1020] text-slate-100 relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/15 rounded-full blur-[100px]"
        aria-hidden="true"
      />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <PairzenLogo size="lg" href="/" className="justify-center" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 pt-3">
            Create your account
          </h1>
          <p className="text-sm text-slate-400">
            Start conducting collaborative coding interviews in seconds.
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
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Maya Lin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
              autoFocus
            />

            {/* Email Address */}
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            {/* Account Role Track */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Primary Track
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-center ${
                    role === "user"
                      ? "border-violet-500 bg-violet-950/40 text-violet-300 font-semibold"
                      : "border-[#1E293B] bg-[#0B1020] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Candidate / Engineer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("interviewer")}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-center ${
                    role === "interviewer"
                      ? "border-violet-500 bg-violet-950/40 text-violet-300 font-semibold"
                      : "border-[#1E293B] bg-[#0B1020] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Technical Interviewer
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
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

              {/* Password Strength Feedback */}
              {password.length > 0 && (
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Strength:</span>
                    <span
                      className={`font-semibold ${
                        strength.score <= 1
                          ? "text-rose-400"
                          : strength.score === 2
                          ? "text-amber-400"
                          : strength.score === 3
                          ? "text-sky-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>

                  {/* 4-segment meter */}
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-colors ${
                          strength.score >= step
                            ? strengthColors[strength.score as keyof typeof strengthColors]
                            : "bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Criteria Checklist */}
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 pt-1">
                    <span className={`flex items-center gap-1.5 ${strength.checks.hasMinLength ? "text-emerald-400" : ""}`}>
                      <Check className="w-3 h-3" /> 8+ characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${strength.checks.hasUppercase ? "text-emerald-400" : ""}`}>
                      <Check className="w-3 h-3" /> Uppercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${strength.checks.hasNumber ? "text-emerald-400" : ""}`}>
                      <Check className="w-3 h-3" /> Number
                    </span>
                    <span className={`flex items-center gap-1.5 ${strength.checks.hasSpecial ? "text-emerald-400" : ""}`}>
                      <Check className="w-3 h-3" /> Special character
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-200 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            {/* Terms Acknowledgement */}
            <div className="flex items-start gap-2.5 pt-2">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#1E293B] bg-[#0B1020] text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
                required
              />
              <label htmlFor="terms" className="text-xs text-slate-400 select-none leading-relaxed">
                I agree to the Pairzen{" "}
                <span className="text-violet-400 hover:underline cursor-pointer">
                  Terms of Service
                </span>{" "}
                and acknowledge the{" "}
                <span className="text-violet-400 hover:underline cursor-pointer">
                  Privacy Policy
                </span>
                .
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-4 font-semibold shadow-lg shadow-violet-900/30"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400">
          Already have a Pairzen account?{" "}
          <Link
            href="/login"
            className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
