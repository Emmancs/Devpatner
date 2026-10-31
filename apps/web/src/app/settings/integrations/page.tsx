'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { useAuth } from '@/features/auth/auth-context';
import {
  ArrowLeft,
  Github,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function IntegrationsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-12 w-full">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">Repository Integrations</h1>
            <p className="text-sm text-gray-400 mt-1">
              Connect version control providers to synchronize repositories, pull requests, and commit snapshots.
            </p>
          </div>

          <div className="space-y-6">
            {/* GitHub Integration Card */}
            <div className="p-6 rounded-xl border border-surface-border bg-surface-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-50 border border-surface-border flex items-center justify-center text-white shrink-0">
                  <Github className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-base">GitHub App Integration</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-brand-blue border border-sky-500/20 font-medium">
                      Phase 4 Ready
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
                    Authorize DevPilot AI to access public repositories and authorized private organizations with minimum required scopes (`repo:status`, `read:org`).
                  </p>
                </div>
              </div>

              <div>
                <button
                  onClick={() => alert('GitHub OAuth & App authorization pipeline is active in Phase 4.')}
                  className="px-4 py-2 rounded-lg bg-surface-50 hover:bg-surface-border border border-surface-border text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Github className="w-4 h-4" /> Connect GitHub
                </button>
              </div>
            </div>

            {/* Security Guarantee Card */}
            <div className="p-5 rounded-xl border border-surface-border bg-surface-200/50 flex items-start gap-3 text-xs text-gray-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block mb-0.5">Zero Arbitrary Execution Policy</span>
                DevPilot AI treats repository content as untrusted input. Tokens are encrypted at rest with AES-256-GCM. Code is parsed using Tree-sitter and AST analyzers without ever being executed on the server.
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

