import React from "react";
import Link from "next/link";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 h-14 border-b border-[#ebebeb] bg-[#fafafa]/90 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between max-w-[1280px] w-full mx-auto">
      <div className="flex items-center space-x-3">
        <Link
          href="/"
          className="text-[13px] font-mono tracking-tight text-[#000000] font-semibold select-none flex items-center gap-1.5"
          aria-label="RepoPilot Product Home"
        >
          <span>▲</span> RepoPilot
        </Link>
        <span className="hidden sm:inline-block text-[11px] font-mono text-[#8f8f8f] uppercase tracking-wider pl-2 border-l border-[#ebebeb]">
          Product
        </span>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-5 text-[13px]">
        <Link
          href="#how-it-works"
          className="text-[#666666] hover:text-[#171717] transition-colors font-mono text-xs hidden sm:inline-block"
        >
          How it works
        </Link>
        <Link
          href="/app"
          className="text-[#171717] hover:text-[#000000] font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#f0f0f0] hover:bg-[#ebebeb] border border-[#d6d6d6] transition-colors"
        >
          Open workspace
        </Link>
        <Link
          href="/login"
          className="text-[#666666] hover:text-[#171717] transition-colors font-mono text-xs"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="px-2.5 py-1 rounded text-xs font-mono bg-[#171717] text-white hover:bg-[#333333] transition-colors"
        >
          Sign up
        </Link>
      </div>
    </header>
  );
}

