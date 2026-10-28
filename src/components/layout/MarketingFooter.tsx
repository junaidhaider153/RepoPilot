import React from "react";
import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#ebebeb] py-6 px-6 text-center text-xs text-[#8f8f8f] font-mono">
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-4">
          <span>RepoPilot &copy; 2026. Built with Next.js &amp; Gemma.</span>
          <Link href="/about-ai" className="hover:text-[#171717] underline underline-offset-2">About AI</Link>
          <Link href="/privacy" className="hover:text-[#171717] underline underline-offset-2">Privacy</Link>
          <Link href="/terms" className="hover:text-[#171717] underline underline-offset-2">Terms</Link>
        </div>
        <span>Untrusted repo content is sandboxed &amp; bounded.</span>
      </div>
    </footer>
  );
}

