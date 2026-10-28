import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-20 p-8 rounded border border-[#ebebeb] bg-white text-center">
      <div className="font-mono text-xs text-[#8f8f8f] uppercase tracking-wider mb-2">
        404 — Not Found
      </div>
      <h2 className="text-xl font-normal text-[#171717] mb-3">
        Page or resource does not exist
      </h2>
      <p className="text-sm text-[#4d4d4d] mb-6">
        The requested path could not be found. Return to the RepoPilot home dashboard to analyze a repository.
      </p>
      <Link
        href="/"
        className="inline-block px-4 py-2 bg-[#171717] text-white text-sm rounded font-normal hover:bg-[#000000] transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}

