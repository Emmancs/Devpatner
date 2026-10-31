'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AnalysisJobSummary } from '@devpilot/shared';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';

export default function AnalysisHistoryPage() {
  const { id } = useParams();
  const projectId = id as string;
  const [jobs, setJobs] = useState<AnalysisJobSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AnalysisJobSummary[]>(`/projects/${projectId}/analysis`)
      .then(setJobs)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Unable to load analysis history.'));
  }, [projectId]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-gray-100">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Link href={`/projects/${projectId}`} className="text-xs text-gray-400 hover:text-white flex items-center gap-2 mb-6"><ArrowLeft className="w-4 h-4" /> Project overview</Link>
          <h1 className="text-2xl font-bold text-white">Analysis History</h1>
          <p className="text-sm text-gray-400 mt-1 mb-6">Static analysis jobs run against synchronized repositories.</p>
          {error && <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
          {!error && jobs.length === 0 && <div className="p-10 text-center text-gray-400 border border-surface-border rounded-xl bg-surface-100">No analysis jobs yet.</div>}
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl border border-surface-border bg-surface-100 flex items-center justify-between">
                <div><div className="text-sm font-semibold text-white">{job.status}</div><div className="text-xs text-gray-400 mt-1">{job.branch} · {new Date(job.queuedAt).toLocaleString()}</div></div>
                <div className="text-right text-xs text-gray-400"><div>{job.totalFindings || 0} findings</div><div>{job.durationMs || 0} ms</div></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
