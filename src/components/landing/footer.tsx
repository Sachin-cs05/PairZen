import React from "react";
import Link from "next/link";
import { PairzenLogo } from "@/components/brand/logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-[#1E293B] bg-[#080D1A] text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand info */}
          <div className="col-span-2">
            <PairzenLogo size="md" withTagline href="/" />
            <p className="mt-4 max-w-sm text-slate-400 text-xs leading-relaxed">
              Pairzen is a high-performance real-time collaborative coding interview platform designed for engineering teams and interviewers.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium">All systems operational (Phase 1 Ready)</span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-[11px]">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="hover:text-slate-200 transition-colors">
                  Collaborative Editor
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-slate-200 transition-colors">
                  Shared Rooms
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-slate-200 transition-colors">
                  Code Execution
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-slate-200 transition-colors">
                  Interview Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-[11px]">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#architecture" className="hover:text-slate-200 transition-colors">
                  Architecture Roadmap
                </a>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  API Documentation (Phase 3)
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Evaluation Rubrics (Phase 2)
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Question Bank (Phase 2)
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-[11px]">
              Technology
            </h4>
            <ul className="space-y-2">
              <li className="text-slate-400">Next.js 16 App Router</li>
              <li className="text-slate-400">TypeScript Strict</li>
              <li className="text-slate-400">Tailwind CSS Design Tokens</li>
              <li className="text-slate-400">Socket.IO &amp; Monaco Ready</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© 2026 Pairzen Inc. All rights reserved. Code together. Think beyond.</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              Security
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
