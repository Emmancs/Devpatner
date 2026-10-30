'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { useAuth } from '@/features/auth/auth-context';
import {
  FolderGit2,
  PlayCircle,
  AlertTriangle,
  Activity,
  Plus,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();

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
              <Link
                href="/projects/new"
                className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-sky-500 text-white text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> New Project
              </Link>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-5 rounded-xl border border-surface-border bg-surface-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Connected Repos
                </span>
                <FolderGit2 className="w-4 h-4 text-brand-blue" />
              </div>
              <div className="text-2xl font-bold text-white mt-3">0</div>
              <div className="text-xs text-gray-500 mt-1">Active sync enabled</div>
            </div>

            <div className="p-5 rounded-xl border border-surface-border bg-surface-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Analyses Run
                </span>
                <PlayCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-3">0</div>
              <div className="text-xs text-gray-500 mt-1">Total completed jobs</div>
            </div>

            <div className="p-5 rounded-xl border border-surface-border bg-surface-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Open Findings
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-3">0</div>
              <div className="text-xs text-gray-500 mt-1">0 High &bull; 0 Medium &bull; 0 Low</div>
            </div>

            <div className="p-5 rounded-xl border border-surface-border bg-surface-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Security Guard
                </span>
                <ShieldCheck className="w-4 h-4 text-brand-indigo" />
              </div>
              <div className="text-base font-semibold text-emerald-400 mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Active
              </div>
              <div className="text-xs text-gray-500 mt-1">Zero arbitrary execution</div>
            </div>
          </div>

          {/* Empty Projects State */}
          <div className="mt-8 p-12 rounded-xl border border-surface-border border-dashed bg-surface-200/30 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-100 border border-surface-border flex items-center justify-center text-gray-400 mb-4">
              <FolderGit2 className="w-6 h-6 text-brand-blue" />
            </div>
            <h3 className="text-base font-semibold text-white">No projects connected yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mt-1 mb-6">
              Connect a GitHub repository or create a project workspace to initiate AST parsing and AI semantic reviews.
            </p>
            <Link
              href="/projects/new"
              className="px-4 py-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-surface-border text-white text-xs font-medium flex items-center gap-2 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Project
            </Link>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
