'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { useAuth } from '@/features/auth/auth-context';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Shield,
  Key,
  FolderGit2,
  ChevronRight,
} from 'lucide-react';

export default function SettingsPage() {
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
            <h1 className="text-2xl font-bold tracking-tight text-white">Account Settings</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your profile, authentication credentials, and connected tools.
            </p>
          </div>

          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="p-6 rounded-xl border border-surface-border bg-surface-100">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-blue" /> User Profile
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block mb-1">Full Name</span>
                  <span className="text-white font-medium text-sm">{user?.name}</span>
                </div>

                <div>
                  <span className="text-gray-400 block mb-1">Email Address</span>
                  <span className="text-white font-mono text-sm">{user?.email}</span>
                </div>

                <div>
                  <span className="text-gray-400 block mb-1">System Role</span>
                  <span className="text-emerald-400 font-semibold">{user?.role}</span>
                </div>

                <div>
                  <span className="text-gray-400 block mb-1">Member Since</span>
                  <span className="text-gray-300">
                    {user?.createdAt ? formatDate(user.createdAt) : 'Recently'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="p-4 rounded-xl border border-surface-border bg-surface-100 divide-y divide-surface-border">
              <Link
                href="/settings/integrations"
                className="py-3 px-2 flex items-center justify-between hover:bg-surface-50 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <FolderGit2 className="w-5 h-5 text-gray-400 group-hover:text-brand-blue transition-colors" />
                  <div>
                    <span className="font-semibold text-white text-sm block">GitHub & VCS Integrations</span>
                    <span className="text-xs text-gray-400">Configure OAuth tokens and repository sync settings</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

