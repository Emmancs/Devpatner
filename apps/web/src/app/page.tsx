import Link from 'next/link';
import { Terminal, Shield, Cpu, GitBranch, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-brand-blue selection:text-white">
      {/* Navigation */}
      <header className="border-b border-surface-border bg-surface-200/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-indigo flex items-center justify-center text-white font-bold text-lg shadow-sm">
              DP
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">DevPilot <span className="text-brand-blue">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-md bg-brand-blue hover:bg-sky-500 text-white transition-all shadow-sm flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-surface-border bg-surface-100 text-xs font-medium text-brand-blue mb-8">
          <span className="flex h-2 w-2 rounded-full bg-brand-blue animate-pulse" />
          Production Engineering Assistant v0.1.0
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl text-white">
          Deep codebase intelligence, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-300">verified code reviews</span> & AI explanations
        </h1>

        <p className="mt-6 text-lg text-gray-400 max-w-2xl leading-relaxed">
          DevPilot AI empowers engineering teams to audit repositories, uncover architectural vulnerabilities, explore dependencies, and generate validated fixes grounded in real source code.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg bg-brand-blue hover:bg-sky-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-sky-500/10 transition-all"
          >
            Connect Repository <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg border border-surface-border bg-surface-100 hover:bg-surface-50 text-gray-200 font-medium text-sm flex items-center gap-2 transition-all"
          >
            Launch Console
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full">
          <div className="p-6 rounded-xl border border-surface-border bg-surface-100/70 hover:border-gray-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-brand-blue mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Static & AI Dual-Engine</h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Combine deterministic linting and Tree-sitter AST queries with bounded LLM semantic reviews to eliminate hallucinations.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-surface-border bg-surface-100/70 hover:border-gray-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-brand-indigo mb-4">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Repository Grounding</h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Every finding, explanation, and patch references verified repository lines, commit SHAs, and file metadata.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-surface-border bg-surface-100/70 hover:border-gray-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Zero Unchecked Execution</h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Untrusted code is strictly parsed in bounded contexts. AI patches are rendered as reviewable diffs prior to adoption.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 text-center text-xs text-gray-500">
        <p>DevPilot AI Engineering System &bull; Production Foundation</p>
      </footer>
    </div>
  );
}

