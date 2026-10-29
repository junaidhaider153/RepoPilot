import React from "react";
import Link from "next/link";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 h-14 border-b border-neutral-200/90 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between max-w-[1280px] w-full mx-auto select-none">
      <div className="flex items-center space-x-3">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2 group transition-opacity"
          aria-label="RepoPilot Product Home"
        >
          <div className="w-6 h-6 rounded-md bg-neutral-950 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
            ▲
          </div>
          <span>RepoPilot</span>
        </Link>
        <span className="hidden sm:inline-block text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-widest pl-2.5 border-l border-neutral-200">
          Product
        </span>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-5 text-xs">
        <Link
          href="#how-it-works"
          className="text-neutral-600 hover:text-neutral-950 transition-colors font-medium hidden sm:inline-block"
        >
          How it works
        </Link>
        <Link
          href="/app"
          className="text-neutral-800 hover:text-neutral-950 font-medium px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200/70 border border-neutral-200 transition-all shadow-2xs"
        >
          Open workspace
        </Link>
        <Link
          href="/login"
          className="text-neutral-600 hover:text-neutral-950 transition-colors font-medium px-2 py-1"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-black transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0"
        >
          Sign up
        </Link>
      </div>
    </header>
  );
}
