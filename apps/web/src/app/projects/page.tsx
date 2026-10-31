'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { useAuth } from '@/features/auth/auth-context';
import { apiFetch } from '@/lib/api-client';
import { ProjectSummary } from '@devpilot/shared';
import { formatDate } from '@/lib/utils';
import {
  Layers,
  Search,
  Plus,
  FolderGit2,
  ChevronRight,
  GitBranch,
  AlertTriangle,
  Loader2,
  LogOut,
  RefreshCw,
} from 'lucide-react';

export default function ProjectsPage() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ProjectSummary[]>('/projects');
      setProjects(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to retrieve projects list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

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
                  className="px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-surface-100 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/projects"
                  className="px-3 py-1.5 rounded-md bg-surface-50 text-white"
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

        {/* Projects View */}
        <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Project Workspaces</h1>
              <p className="text-sm text-gray-400 mt-1">
                Manage your codebase repositories, track analyses, and review security findings.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchProjects}
                disabled={isLoading}
                title="Refresh projects"
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

          {/* Search bar */}
          <div className="mt-6 flex items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-100 border border-surface-border focus:border-brand-blue focus:outline-none text-sm text-gray-100 placeholder-gray-500 transition-colors"
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchProjects} className="underline hover:text-red-300 font-medium text-xs">
                Retry
              </button>
            </div>
          )}

          {/* Projects Content Grid */}
          <div className="mt-6">
            {isLoading ? (
              <div className="p-20 rounded-xl border border-surface-border bg-surface-100 flex flex-col items-center justify-center text-gray-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
                <span className="text-sm font-medium">Loading project workspaces...</span>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group block p-5 rounded-xl border border-surface-border bg-surface-100 hover:border-gray-700 hover:bg-surface-50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-center text-brand-blue group-hover:border-brand-blue/40 transition-colors">
                            <FolderGit2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-base group-hover:text-brand-blue transition-colors">
                              {project.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mt-0.5">
                              <GitBranch className="w-3 h-3 text-gray-500" />
                              <span>{project.defaultBranch}</span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors shrink-0" />
                      </div>

                      {project.description && (
                        <p className="text-xs text-gray-400 mt-3 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between text-xs text-gray-400">
                      <div>
                        <span>{project.repositoriesCount} repos</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {project.findingsCount.total > 0 ? (
                          <>
                            {project.findingsCount.high > 0 && (
                              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                                {project.findingsCount.high} H
                              </span>
                            )}
                            {project.findingsCount.medium > 0 && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                                {project.findingsCount.medium} M
                              </span>
                            )}
                            {project.findingsCount.low > 0 && (
                              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                                {project.findingsCount.low} L
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Clean
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-16 rounded-xl border border-surface-border border-dashed bg-surface-200/30 flex flex-col items-center justify-center text-center">
                <Layers className="w-10 h-10 text-gray-500 mb-3" />
                <h3 className="text-base font-semibold text-white">
                  {search ? 'No matching projects found' : 'No projects created yet'}
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mt-1 mb-5">
                  {search
                    ? `No project workspace matched your search term "${search}".`
                    : 'Create a project to connect repositories and run code analyses.'}
                </p>
                <Link
                  href="/projects/new"
                  className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Project
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

