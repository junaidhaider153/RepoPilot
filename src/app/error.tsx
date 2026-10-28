"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Redact or log safely without secrets
    console.error("Application error boundary caught error:", error.message);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto my-16 p-6 rounded border border-[#ebebeb] bg-white text-center shadow-none">
      <div className="font-mono text-xs text-[#8f8f8f] uppercase tracking-wider mb-2">
        System Notice
      </div>
      <h2 className="text-xl font-normal text-[#171717] mb-3">
        An unexpected application error occurred
      </h2>
      <p className="text-sm text-[#4d4d4d] mb-6">
        {error.message || "The request could not be processed safely. Please retry or verify your input."}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-[#171717] text-white text-sm rounded font-normal hover:bg-[#000000] transition-colors"
      >
        Retry action
      </button>
    </div>
  );
}

