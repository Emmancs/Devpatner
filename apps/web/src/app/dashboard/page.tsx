'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { useAuth } from '@/features/auth/auth-context';
import { apiFetch } from '@/lib/api-client';
import { DashboardMetrics } from '@devpilot/shared';
import { formatDate } from '@/lib/utils';
import {
  FolderGit2,
  PlayCircle,
  AlertTriangle,
  ShieldCheck,
  Plus,
  LogOut,
  ArrowRight,
  Loader2,
  Layers,
  ChevronRight,
  GitBranch,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<DashboardMetrics>('/projects/dashboard/metrics');
      setMetrics(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-gray-100">
        {/* Navigation Bar */}
        <header className="border-b border-surface-border bg-surface-200/60 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-indigo flex items-center justify-center text-white font-bold text-base shadow-sm">
                  DP
                </div>
                <span className="font-semibold text-lg tracking-tight text-white">
                  DevPilot <span className="text-brand-blue">AI</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-md bg-surface-50 text-white"
                >
                  Dashboard
                </Link>
                <Link
                  href="/projects"
                  className="px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-surface-100 transition-colors"
                >
                  Projects
                </Link>
                <Link
                  href="/settings"
                  className="px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-surface-100 transition-colors"
                >
                  Settings
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white">{user?.name}</div>
                <div className="text-xs text-gray-400">{user?.email}</div>
              </div>

              <div className="h-8 w-8 rounded-full bg-surface-50 border border-surface-border flex items-center justify-center text-xs font-semibold text-brand-blue uppercase">
                {user?.name?.slice(0, 2) || 'US'}
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg border border-surface-border text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Engineering Console</h1>
              <p className="text-sm text-gray-400 mt-1">
                Workspace overview for active repositories, findings, and analysis pipelines.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchMetrics}
                disabled={isLoading}
                title="Refresh metrics"
                className="p-2 rounded-lg border border-surface-border bg-surface-100 hover:bg-surface-50 text-gray-400 hover:text-white transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <Link
                href="/projects/new"
                className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-sky-500 text-white text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> New Project
              </Link>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchMetrics} className="underline hover:text-red-300 font-medium text-xs">
                Retry
              </button>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-5 rounded-xl border border-surface-border bg-surface-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Connected Repos
                </span>
                <FolderGit2 className="w-4 h-4 text-brand-blue" />
              </div>
              <div className="text-2xl font-bold text-white mt-3">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-500" /> : metrics?.totalRepositories ?? 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">Active sync enabled</div>
            </div>

            <div className="p-5 rounded-xl border border-surface-border bg-surface-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Analyses Run
                </span>
                <PlayCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-3">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-500" /> : metrics?.totalAnalyses ?? 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">Total completed jobs</div>
            </div>

            <div className="p-5 rounded-xl border border-surface-border bg-surface-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Open Findings
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-3">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                ) : (
                  metrics?.findingsBySeverity.total ?? 0
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics ? (
                  <>
                    <span className="text-red-400 font-medium">{metrics.findingsBySeverity.high} High</span> &bull;{' '}
                    <span className="text-amber-400">{metrics.findingsBySeverity.medium} Med</span> &bull;{' '}
                    <span className="text-sky-400">{metrics.findingsBySeverity.low} Low</span>
                  </>
                ) : (
                  '0 High • 0 Med • 0 Low'
                )}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-surface-border bg-surface-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Security Guard
                </span>
                <ShieldCheck className="w-4 h-4 text-brand-indigo" />
              </div>
              <div className="text-base font-semibold text-emerald-400 mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Protected
              </div>
              <div className="text-xs text-gray-500 mt-1">Zero arbitrary execution</div>
            </div>
          </div>

          {/* Recent Projects and Activity Section */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projects List Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-blue" /> Recent Projects
                </h2>
                <Link
                  href="/projects"
                  className="text-xs text-brand-blue hover:underline flex items-center gap-1 font-medium"
                >
                  View all projects <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {isLoading ? (
                <div className="p-12 rounded-xl border border-surface-border bg-surface-100 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                </div>
              ) : metrics?.recentProjects && metrics.recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {metrics.recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block p-4 rounded-xl border border-surface-border bg-surface-100 hover:border-gray-700 hover:bg-surface-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm hover:text-brand-blue transition-colors">
                              {project.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full border border-surface-border bg-surface-200 text-gray-400 font-mono">
                              {project.defaultBranch}
                            </span>
                          </div>
                          {project.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{project.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {project.findingsCount.high > 0 && (
                            <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
                              {project.findingsCount.high} High
                            </span>
                          )}
                          <span className="text-gray-500">{project.repositoriesCount} repos</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-surface-border border-dashed bg-surface-200/30 flex flex-col items-center justify-center text-center">
                  <FolderGit2 className="w-8 h-8 text-gray-500 mb-3" />
                  <h3 className="text-sm font-semibold text-white">No projects created yet</h3>
                  <p className="text-xs text-gray-400 mt-1 mb-4">
                    Create a project workspace to attach repositories and start audits.
                  </p>
                  <Link
                    href="/projects/new"
                    className="px-3.5 py-1.5 rounded-lg bg-brand-blue hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Project
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions & Recent Analyses Column */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Recent Analyses
              </h2>

              {isLoading ? (
                <div className="p-12 rounded-xl border border-surface-border bg-surface-100 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                </div>
              ) : metrics?.recentAnalyses && metrics.recentAnalyses.length > 0 ? (
                <div className="space-y-3">
                  {metrics.recentAnalyses.map((job) => (
                    <div
                      key={job.id}
                      className="p-3.5 rounded-xl border border-surface-border bg-surface-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-mono text-gray-300">
                          <GitBranch className="w-3.5 h-3.5 text-gray-500" />
                          <span>{job.branch}</span>
                          <span className="text-gray-500">@{job.commitSha.slice(0, 7)}</span>
                        </div>
                        <div className="text-gray-500 mt-1">{formatDate(job.queuedAt)}</div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            job.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : job.status === 'FAILED'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}
                        >
                          {job.status}
                        </span>
                        {job.totalFindings !== undefined && (
                          <div className="text-gray-400 text-[11px] mt-1">
                            {job.totalFindings} findings
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-surface-border bg-surface-100 text-center text-xs text-gray-500">
                  <Clock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  No analyses triggered yet.
                </div>
              )}

              {/* Quick Guide Card */}
              <div className="p-4 rounded-xl border border-surface-border bg-gradient-to-br from-surface-100 to-surface-200 text-xs">
                <span className="font-semibold text-white block mb-1">Standard Engineering Workflow</span>
                <p className="text-gray-400 leading-relaxed">
                  1. Create a project container.<br />
                  2. Connect a repository or upload source code.<br />
                  3. Run deterministic static checks & AI reviews.<br />
                  4. Inspect verified findings with side-by-side diffs.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
