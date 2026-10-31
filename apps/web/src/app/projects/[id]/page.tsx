'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { useAuth } from '@/features/auth/auth-context';
import { apiFetch } from '@/lib/api-client';
import { GitHubRepositoryOption, ProjectDetail } from '@devpilot/shared';
import { formatDate, formatBytes } from '@/lib/utils';
import {
  ArrowLeft,
  FolderGit2,
  GitBranch,
  PlayCircle,
  FileCode2,
  AlertTriangle,
  MessageSquare,
  History,
  ExternalLink,
  Plus,
  Loader2,
  ShieldAlert,
  Clock,
  Sparkles,
  GitCommit,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubRepositories, setGithubRepositories] = useState<GitHubRepositoryOption[]>([]);
  const [showRepositoryPicker, setShowRepositoryPicker] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);

  const fetchProject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ProjectDetail>(`/projects/${projectId}`);
      setProject(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const openRepositoryPicker = async () => {
    setShowRepositoryPicker(true);
    try {
      const response = await apiFetch<{ items: GitHubRepositoryOption[] }>('/github/repositories');
      setGithubRepositories(response.items);
    } catch (err) {
      setError((err as Error).message || 'Connect GitHub before attaching a repository.');
    }
  };

  const attachRepository = async (fullName: string) => {
    setIsAttaching(true);
    try {
      await apiFetch(`/projects/${projectId}/repositories`, {
        method: 'POST',
        body: JSON.stringify({ fullName }),
      });
      setShowRepositoryPicker(false);
      await fetchProject();
    } catch (err) {
      setError((err as Error).message || 'Unable to attach repository.');
    } finally {
      setIsAttaching(false);
    }
  };

  const startAnalysis = async () => {
    if (!primaryRepo) {
      setAnalysisMessage('Attach and synchronize a repository before starting analysis.');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisMessage(null);
    try {
      await apiFetch(`/projects/${projectId}/repositories/${primaryRepo.id}/analysis`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setAnalysisMessage('Static analysis completed.');
      await fetchProject();
    } catch (err) {
      setAnalysisMessage((err as Error).message || 'Static analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          <span className="text-sm font-medium">Loading project workspace...</span>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !project) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 max-w-md">
            <h3 className="font-semibold text-base mb-1">Failed to load project</h3>
            <p className="text-xs mb-4">{error || 'Project not found.'}</p>
            <Link
              href="/projects"
              className="px-4 py-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-surface-border text-white text-xs font-medium inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Projects
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const primaryRepo = project.repositories[0];

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-gray-100">
        {/* Navigation Bar */}
        <header className="border-b border-surface-border bg-surface-200/60 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/projects"
                className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Projects
              </Link>
              <span className="text-gray-600">/</span>
              <span className="font-semibold text-white text-sm">{project.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchProject}
                title="Refresh project"
                className="p-2 rounded-lg border border-surface-border bg-surface-100 hover:bg-surface-50 text-gray-400 hover:text-white transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Project Header */}
        <div className="border-b border-surface-border bg-surface-100/50">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-50 border border-surface-border flex items-center justify-center text-brand-blue">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <GitBranch className="w-3.5 h-3.5 text-gray-500" />
                        {project.defaultBranch}
                      </span>
                      <span>&bull;</span>
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {project.description && (
                  <p className="text-xs text-gray-400 mt-3 max-w-2xl leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/projects/${project.id}/chat`}
                  className="px-4 py-2 rounded-lg border border-surface-border bg-surface-100 hover:bg-surface-50 text-gray-200 text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-brand-blue" /> Repository Chat
                </Link>

                <button
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />} {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                </button>
              </div>
            </div>

            {analysisMessage && (
              <div className="mt-4 p-3 rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-300 text-xs">
                {analysisMessage}
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mt-8 border-b border-surface-border -mb-8 text-xs font-medium">
              <Link
                href={`/projects/${project.id}`}
                className="px-4 py-2.5 border-b-2 border-brand-blue text-white"
              >
                Overview
              </Link>
              <Link
                href={`/projects/${project.id}/files`}
                className="px-4 py-2.5 text-gray-400 hover:text-white border-b-2 border-transparent transition-colors flex items-center gap-1.5"
              >
                <FileCode2 className="w-3.5 h-3.5" /> Files
              </Link>
              <Link
                href={`/projects/${project.id}/findings`}
                className="px-4 py-2.5 text-gray-400 hover:text-white border-b-2 border-transparent transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Findings
                {project.findingsCount.total > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-surface-50 text-[10px] text-gray-300">
                    {project.findingsCount.total}
                  </span>
                )}
              </Link>
              <Link
                href={`/projects/${project.id}/analysis`}
                className="px-4 py-2.5 text-gray-400 hover:text-white border-b-2 border-transparent transition-colors flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" /> Analysis History
              </Link>
              <Link
                href={`/projects/${project.id}/chat`}
                className="px-4 py-2.5 text-gray-400 hover:text-white border-b-2 border-transparent transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Codebase Chat
              </Link>
            </div>
          </div>
        </div>

        {/* Main Overview Content */}
        <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full space-y-8">
          {/* Findings by Severity Cards */}
          <div>
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Findings Breakdown
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <span className="text-xs font-medium text-red-400 uppercase tracking-wider">High Severity</span>
                <div className="text-2xl font-bold text-white mt-2">{project.findingsCount.high}</div>
                <span className="text-[11px] text-gray-500 mt-0.5 block">Security & logic blockers</span>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Medium Severity</span>
                <div className="text-2xl font-bold text-white mt-2">{project.findingsCount.medium}</div>
                <span className="text-[11px] text-gray-500 mt-0.5 block">Resource & boundary risks</span>
              </div>

              <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5">
                <span className="text-xs font-medium text-sky-400 uppercase tracking-wider">Low Severity</span>
                <div className="text-2xl font-bold text-white mt-2">{project.findingsCount.low}</div>
                <span className="text-[11px] text-gray-500 mt-0.5 block">Code quality & style</span>
              </div>

              <div className="p-4 rounded-xl border border-surface-border bg-surface-100">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Informational</span>
                <div className="text-2xl font-bold text-white mt-2">{project.findingsCount.info}</div>
                <span className="text-[11px] text-gray-500 mt-0.5 block">Architectural insights</span>
              </div>
            </div>
          </div>

          {/* Connected Repositories Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Connected Repositories ({project.repositories.length})
              </h2>
              <button
                onClick={openRepositoryPicker}
                className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface-100 hover:bg-surface-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Connect Repository
              </button>
            </div>

            {showRepositoryPicker && (
              <div className="mb-4 p-4 rounded-xl border border-surface-border bg-surface-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Select an authorized GitHub repository</h3>
                  <button onClick={() => setShowRepositoryPicker(false)} className="text-xs text-gray-400 hover:text-white">Close</button>
                </div>
                {githubRepositories.length === 0 ? (
                  <p className="text-xs text-gray-400">No repositories available. Connect GitHub or check your authorization scopes.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-auto">
                    {githubRepositories.map((repo) => (
                      <button key={repo.id} disabled={isAttaching} onClick={() => attachRepository(repo.fullName)} className="text-left p-3 rounded-lg border border-surface-border hover:border-brand-blue/50 hover:bg-surface-50 disabled:opacity-50">
                        <span className="block text-sm font-medium text-white">{repo.fullName}</span>
                        <span className="text-xs text-gray-400">{repo.isPrivate ? 'Private' : 'Public'} · {repo.defaultBranch}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {project.repositories.length > 0 ? (
              <div className="space-y-3">
                {project.repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="p-5 rounded-xl border border-surface-border bg-surface-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{repo.fullName}</span>
                        {repo.isPrivate ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            Private
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            Public
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2 font-mono">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3.5 h-3.5 text-gray-500" /> {repo.defaultBranch}
                        </span>
                        {repo.primaryLanguage && (
                          <span className="text-sky-400">{repo.primaryLanguage}</span>
                        )}
                        <span>{formatBytes(repo.sizeKb * 1024)}</span>
                        {repo.lastSyncedAt && (
                          <span className="text-gray-500 font-sans">
                            Synced {formatDate(repo.lastSyncedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-surface-border hover:bg-surface-50 text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        GitHub <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-surface-border border-dashed bg-surface-200/30 text-center">
                <FolderGit2 className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">No repository attached</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-4">
                  Connect a GitHub repository to enable source browsing, code indexing, and automated analysis.
                </p>
                <button
                  onClick={() => router.push('/settings/integrations')}
                  className="px-3.5 py-1.5 rounded-lg bg-brand-blue hover:bg-sky-500 text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Connect GitHub Repository
                </button>
              </div>
            )}
          </div>

          {/* Recent Analysis Runs */}
          <div>
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Recent Analyses
            </h2>
            {project.recentAnalyses.length > 0 ? (
              <div className="space-y-3">
                {project.recentAnalyses.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-surface-border bg-surface-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-center text-gray-400 font-mono">
                        <GitCommit className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-mono text-gray-200">
                          <span>{job.branch}</span>
                          <span className="text-gray-500">@{job.commitSha.slice(0, 7)}</span>
                        </div>
                        <div className="text-gray-500 mt-0.5">{formatDate(job.queuedAt)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {job.totalFindings !== undefined && (
                        <span className="text-gray-300 font-medium">
                          {job.totalFindings} findings ({job.highSeverity} High)
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : job.status === 'FAILED'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-surface-border bg-surface-100 text-center text-xs text-gray-500">
                <Clock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                No analysis jobs have run for this project yet. Click &quot;Start Analysis&quot; above to trigger your first run.
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
