/**
 * 404 page: generic not-found view with a link back to home.
 */

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center max-w-md">
          <div
            className="inline-flex p-4 rounded-xl mb-6"
            style={{ backgroundColor: 'var(--color-paper-warm)' }}
          >
            <FileQuestion className="w-12 h-12" style={{ color: 'var(--color-accent)' }} />
          </div>

          <h1 className="text-3xl font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
            Page not found
          </h1>

          <p className="mb-6" style={{ color: 'var(--color-muted)' }}>
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            Go to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
