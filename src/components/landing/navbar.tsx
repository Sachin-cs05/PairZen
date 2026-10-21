"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Sparkles, User } from "lucide-react";
import { PairzenLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1E293B]/80 bg-[#0B1020]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <PairzenLogo size="md" href="/" />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a
            href="#preview"
            className="hover:text-violet-400 transition-colors"
          >
            Workspace
          </a>
          <a
            href="#features"
            className="hover:text-violet-400 transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-violet-400 transition-colors"
          >
            How It Works
          </a>
          <a
            href="#architecture"
            className="hover:text-violet-400 transition-colors"
          >
            Architecture
          </a>
        </nav>

        {/* Desktop CTA actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors flex items-center gap-1.5"
              >
                <User className="w-4 h-4 text-violet-400" />
                <span>{user?.name?.split(" ")[0]}</span>
              </Link>
              <Button
                href="/dashboard"
                size="sm"
                variant="primary"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Dashboard
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Button
                href="/register"
                size="sm"
                variant="primary"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            href={isAuthenticated ? "/dashboard" : "/login"}
            size="sm"
            variant="primary"
            className="text-xs px-2.5 py-1"
          >
            {isAuthenticated ? "Dashboard" : "Sign In"}
          </Button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#121A2B] transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#1E293B] bg-[#0E1524] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-300">
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#18233A] hover:text-white transition-colors"
            >
              Workspace
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#18233A] hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#18233A] hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#18233A] hover:text-white transition-colors"
            >
              Architecture
            </a>
          </nav>
          <div className="pt-2 border-t border-[#1E293B] flex flex-col gap-2">
            {isAuthenticated ? (
              <Button
                href="/dashboard"
                variant="primary"
                size="sm"
                className="w-full justify-center"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  href="/login"
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                >
                  Sign In
                </Button>
                <Button
                  href="/register"
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Create Free Account
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
