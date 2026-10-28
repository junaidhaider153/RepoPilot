import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "RepoPilot — From codebase to blueprint",
  description:
    "Analyze public GitHub codebases, explore architecture grounded in repository files, generate project specifications, and produce actionable innovation blueprints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-[#fafafa] text-[#171717] antialiased">
        {/* Top Navigation */}
        <header className="sticky top-0 z-50 h-16 border-b border-[#ebebeb] bg-[#fafafa]/90 backdrop-blur-sm px-6 flex items-center justify-between max-w-[1280px] w-full mx-auto">
          <div className="flex items-center space-x-3">
            <span className="text-[13px] font-mono tracking-tight text-[#000000] font-semibold select-none flex items-center gap-1.5">
              <span>▲</span> RepoPilot
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-[#8f8f8f] uppercase tracking-wider pl-2 border-l border-[#ebebeb]">
              Codebase to Blueprint
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[13px]">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#666666] hover:text-[#171717] transition-colors font-mono text-xs flex items-center gap-1"
            >
              Public Repos Only
            </a>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#ebebeb] text-[#4d4d4d]">
              Gemma Powered
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#ebebeb] py-6 px-6 text-center text-xs text-[#8f8f8f] font-mono">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>RepoPilot &copy; 2026. Built with Next.js &amp; Gemma. MIT License.</span>
            <span>Untrusted repo content is sandboxed &amp; bounded.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

