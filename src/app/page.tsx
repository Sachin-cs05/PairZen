import React from "react";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { ProductPreview } from "@/components/landing/product-preview";
import { LandingFeatures } from "@/components/landing/features";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingCtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/footer";

export const metadata = {
  title: "Pairzen — Code together. Think beyond.",
  description:
    "A premium real-time collaborative coding interview platform designed for engineering teams and interviewers. Sub-millisecond sync, sandboxed code execution, and objective candidate evaluations.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B1020] text-slate-100 selection:bg-violet-600/30 selection:text-white">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <ProductPreview />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
