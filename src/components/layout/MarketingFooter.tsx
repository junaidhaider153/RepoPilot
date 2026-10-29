import React from "react";
import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-neutral-200/90 py-6 px-6 text-xs text-neutral-500 bg-white/50 select-none">
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-5 h-5 rounded-md bg-white p-0.5 border border-neutral-200 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/icon.jpg" alt="RepoPilot" className="w-full h-full object-contain rounded" />
          </div>
          <span className="font-semibold text-neutral-900">RepoPilot &copy; 2026</span>
          <span className="text-neutral-300">•</span>
          <Link href="/about-ai" className="hover:text-neutral-900 underline underline-offset-2 transition-colors">About AI</Link>
          <Link href="/privacy" className="hover:text-neutral-900 underline underline-offset-2 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-neutral-900 underline underline-offset-2 transition-colors">Terms</Link>
        </div>
        <span className="text-neutral-400 font-mono text-[11px]">Untrusted repo content is sandboxed &amp; bounded.</span>
      </div>
    </footer>
  );
}
