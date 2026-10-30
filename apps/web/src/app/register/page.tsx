'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { ApiClientError } from '@/lib/api-client';
import { Terminal, Lock, Mail, User, AlertCircle, ArrowRight, Loader2, Check } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasLength && hasLower && hasUpper && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Please ensure your password meets all complexity requirements.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ name, email, password });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError((err as Error).message || 'Failed to register account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background selection:bg-brand-blue selection:text-white py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-indigo flex items-center justify-center text-white font-bold text-xl shadow-md">
              DP
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">
              DevPilot <span className="text-brand-blue">AI</span>
            </span>
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-gray-200">Create an account</h2>
          <p className="text-xs text-gray-400 mt-1">
            Start auditing repositories and conducting AI code reviews
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-xl border border-surface-border bg-surface-100/90 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-6 p-3 rounded-lg border border-red-500/30 bg-red-500/10 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Developer"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-200 border border-surface-border focus:border-brand-blue focus:outline-none text-sm text-gray-100 placeholder-gray-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@devpilot.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-200 border border-surface-border focus:border-brand-blue focus:outline-none text-sm text-gray-100 placeholder-gray-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-200 border border-surface-border focus:border-brand-blue focus:outline-none text-sm text-gray-100 placeholder-gray-500 transition-colors"
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <Check className="w-3.5 h-3.5" /> 8+ characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <Check className="w-3.5 h-3.5" /> 1 uppercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <Check className="w-3.5 h-3.5" /> 1 lowercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <Check className="w-3.5 h-3.5" /> 1 number
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isPasswordValid}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-brand-blue hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-border text-center text-xs text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-blue hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
