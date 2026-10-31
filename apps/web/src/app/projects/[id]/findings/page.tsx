'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FindingItem } from '@devpilot/shared';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function FindingsPage() {
  const { id } = useParams();
  const projectId = id as string;
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<FindingItem[]>(`/projects/${projectId}/findings`)
      .then(setFindings)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Unable to load findings.'));
  }, [projectId]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-gray-100">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Link href={`/projects/${projectId}`} className="text-xs text-gray-400 hover:text-white flex items-center gap-2 mb-6"><ArrowLeft className="w-4 h-4" /> Project overview</Link>
          <h1 className="text-2xl font-bold text-white">Analysis Findings</h1>
          <p className="text-sm text-gray-400 mt-1 mb-6">Deterministic findings from the latest synchronized source.</p>
          {error && <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
          {!error && findings.length === 0 && <div className="p-10 text-center text-gray-400 border border-surface-border rounded-xl bg-surface-100">No findings yet.</div>}
          <div className="space-y-3">
            {findings.map((finding) => (
              <article key={finding.id} className="p-4 rounded-xl border border-surface-border bg-surface-100">
                <div className="flex items-start justify-between gap-4">
                  <div><h2 className="font-semibold text-white">{finding.title}</h2><p className="text-xs text-gray-400 mt-1">{finding.description}</p></div>
                  <span className="text-[10px] uppercase text-amber-300">{finding.severity}</span>
                </div>
                <div className="mt-3 text-xs font-mono text-gray-500">{finding.filePath}:{finding.startLine}</div>
                {finding.evidence && <pre className="mt-2 p-2 rounded bg-surface-200 text-xs text-gray-300 overflow-auto">{finding.evidence}</pre>}
              </article>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
