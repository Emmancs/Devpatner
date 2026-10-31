'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ProjectSummary, CreateProjectRequest } from '@devpilot/shared';
import {
  ArrowLeft,
  FolderPlus,
  GitBranch,
  FileText,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateProjectRequest = {
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
        defaultBranch: defaultBranch.trim() ? defaultBranch.trim() : 'main',
      };

      const project = await apiFetch<ProjectSummary>('/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push(`/projects/${project.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError((err as Error).message || 'Failed to create project workspace.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-12 w-full">
          {/* Back button */}
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <FolderPlus className="w-6 h-6 text-brand-blue" />
              Create Project Workspace
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Organize your codebases, attach repositories, and configure analysis standards.
            </p>
          </div>

          {/* Form Card */}
          <div className="p-8 rounded-xl border border-surface-border bg-surface-100 shadow-xl">
            {error && (
              <div className="mb-6 p-3 rounded-lg border border-red-500/30 bg-red-500/10 flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-2">
                  Project Workspace Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. payment-service"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-200 border border-surface-border focus:border-brand-blue focus:outline-none text-sm text-gray-100 placeholder-gray-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  A recognizable identifier for this service or codebase.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-2">
                  Description <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the application architecture, responsibilities, or engineering owner..."
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-200 border border-surface-border focus:border-brand-blue focus:outline-none text-sm text-gray-100 placeholder-gray-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-2">
                  Default Target Branch
                </label>
                <div className="relative max-w-xs">
                  <GitBranch className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    placeholder="main"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-200 border border-surface-border focus:border-brand-blue focus:outline-none text-sm text-gray-100 placeholder-gray-500 transition-colors font-mono"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Primary git branch analyzed by default.
                </p>
              </div>

              <div className="pt-6 border-t border-surface-border flex items-center justify-end gap-3">
                <Link
                  href="/projects"
                  className="px-4 py-2 rounded-lg border border-surface-border bg-surface-200 hover:bg-surface-50 text-gray-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-5 py-2 rounded-lg bg-brand-blue hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Workspace...
                    </>
                  ) : (
                    <>
                      Create Workspace
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

