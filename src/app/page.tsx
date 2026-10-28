export default function HomePage() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto py-12">
      {/* Hero Section */}
      <div className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white border border-[#ebebeb] text-[11px] font-mono text-[#666666]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a]"></span>
          <span>RepoPilot MVP Active</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-[#171717] leading-tight">
          From codebase to blueprint.
        </h1>
        <p className="text-lg text-[#666666] max-w-2xl font-normal leading-relaxed">
          Analyze public GitHub repositories with bounded context extraction, grounded repository Q&amp;A, automated PRD/TRD/TDD documentation, and actionable innovation roadmaps.
        </p>
      </div>

      {/* Repository Input Section Placeholder */}
      <section aria-labelledby="repo-input-heading" className="p-6 rounded border border-[#ebebeb] bg-white space-y-4">
        <h2 id="repo-input-heading" className="text-sm font-mono uppercase tracking-wider text-[#8f8f8f]">
          Target Repository
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            placeholder="https://github.com/owner/repository"
            className="flex-1 px-3 py-2 text-sm bg-white border border-[#ebebeb] rounded text-[#171717] placeholder-[#a8a8a8] font-mono focus:border-[#171717] focus:outline-none transition-colors"
            disabled
          />
          <button
            disabled
            className="px-5 py-2 bg-[#171717] text-white text-sm rounded font-normal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Repository
          </button>
        </div>
        <p className="text-xs text-[#8f8f8f] font-mono">
          Only public GitHub repositories are accepted. Private repositories and OAuth are outside MVP scope.
        </p>
      </section>

      {/* Feature Navigation Grid Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded border border-[#ebebeb] bg-white space-y-2">
          <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">01 / Overview</span>
          <h3 className="text-sm font-medium text-[#171717]">Repository Overview</h3>
          <p className="text-xs text-[#666666]">Stack detection, bounded file tree, key architecture components, and evidence notes.</p>
        </div>
        <div className="p-4 rounded border border-[#ebebeb] bg-white space-y-2">
          <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">02 / Chat</span>
          <h3 className="text-sm font-medium text-[#171717]">Ask the Codebase</h3>
          <p className="text-xs text-[#666666]">Factual answers grounded directly in retrieved files with exact path citations.</p>
        </div>
        <div className="p-4 rounded border border-[#ebebeb] bg-white space-y-2">
          <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">03 / Specs</span>
          <h3 className="text-sm font-medium text-[#171717]">Project Documents</h3>
          <p className="text-xs text-[#666666]">PRD, TRD, TDD, and coding-agent prompt synthesized from a unified specification.</p>
        </div>
        <div className="p-4 rounded border border-[#ebebeb] bg-white space-y-2">
          <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">04 / Blueprint</span>
          <h3 className="text-sm font-medium text-[#171717]">Innovation Blueprint</h3>
          <p className="text-xs text-[#666666]">Three prioritized opportunities and an actionable implementation blueprint.</p>
        </div>
      </div>
    </div>
  );
}

