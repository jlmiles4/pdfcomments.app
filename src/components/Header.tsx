'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

export function Header() {
  return (
    <header>
      <div className="max-w-6xl mx-auto px-6">
        <div
          className="flex items-center justify-between py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <FileText className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>
              PDF Comment Extractor
            </span>
          </Link>
          <Link
            href="/about"
            className="text-sm px-3 py-1.5 rounded transition-colors"
            style={{ color: 'var(--color-muted)' }}
          >
            About
          </Link>
        </div>
      </div>
    </header>
  );
}
