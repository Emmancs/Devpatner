import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/features/auth/auth-context';

export const metadata: Metadata = {
  title: 'DevPilot AI - AI Software Engineering Assistant',
  description: 'Production-grade AI Software Engineering Assistant for code analysis, review, and codebase exploration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-gray-100 antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
