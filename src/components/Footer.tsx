'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="max-w-6xl mx-auto px-6">
        <div
          className="py-4 text-sm"
          style={{
            borderTop: '1px solid var(--color-border)',
            color: 'var(--color-muted)'
          }}
        >
          {/* Mobile: stacked, Desktop: three columns */}
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-0">
            <span className="text-center sm:text-left">&copy; 2026 PDF Comments</span>
            <a
              href="mailto:info@pdfcomments.app"
              className="text-center hover:underline"
            >
              API and corporate licensing available
            </a>
            <Link
              href="/privacy"
              className="text-center sm:text-right hover:underline"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
