'use client';

import { Shield, Zap, Code } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12 flex-1">
        <div className="space-y-10">
          <div>
            <h1 className="text-2xl font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
              About
            </h1>
            <p style={{ color: 'var(--color-muted)' }}>
              PDF Comment Extractor is a tool that extracts highlights, sticky notes,
              strikethroughs, and other editorial marks from reviewed PDFs into structured Markdown or plain text.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div className="card p-5">
              <Shield className="w-5 h-5 mb-3" style={{ color: 'var(--color-accent)' }} />
              <h2 className="font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
                100% Private
              </h2>
              <p style={{ color: 'var(--color-muted)' }}>
                Your files never leave your browser. All processing happens locally.
              </p>
            </div>
            <div className="card p-5">
              <Zap className="w-5 h-5 mb-3" style={{ color: 'var(--color-accent)' }} />
              <h2 className="font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
                AI-Ready Output
              </h2>
              <p style={{ color: 'var(--color-muted)' }}>
                Markdown includes page locations to help AI agents find annotations.
              </p>
            </div>
            <div className="card p-5">
              <Code className="w-5 h-5 mb-3" style={{ color: 'var(--color-accent)' }} />
              <h2 className="font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
                Multiple Formats
              </h2>
              <p style={{ color: 'var(--color-muted)' }}>
                Export as Markdown tables, checklists, or plain text.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
              Use Cases
            </h2>
            <ul className="space-y-2 list-disc list-inside" style={{ color: 'var(--color-muted)' }}>
              <li>Collecting design feedback from PDF proofs</li>
              <li>Processing editorial reviews and revision requests</li>
              <li>Extracting client comments for project management</li>
              <li>Iterating on documents with AI assistance</li>
            </ul>
          </div>

          <div
            className="p-6 rounded-lg"
            style={{ backgroundColor: 'var(--color-paper-warm)', border: '1px solid var(--color-border)' }}
          >
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
              Licensing
            </h2>
            <p className="mb-4" style={{ color: 'var(--color-ink-light)' }}>
              This tool is free to use for personal and commercial purposes.
            </p>
            <p style={{ color: 'var(--color-muted)' }}>
              For API integration, white-label deployment, or enterprise support, reach out at{' '}
              <a
                href="mailto:info@pdfcomments.app"
                className="hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                info@pdfcomments.app
              </a>
            </p>
          </div>

          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Built by{' '}
            <a
              href="https://landonmiles.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: 'var(--color-accent)' }}
            >
              Landon Miles
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
