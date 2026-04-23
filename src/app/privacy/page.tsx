/**
 * Privacy page: explains client-side processing and data handling.
 */

'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12 flex-1">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
              Privacy Policy
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Last updated: January 2026
            </p>
          </div>

          <div className="space-y-6" style={{ color: 'var(--color-ink-light)' }}>
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
                Summary
              </h2>
              <p>
                PDF Comment Extractor processes your files entirely in your browser.
                Your PDF files are never uploaded to any server. We do not collect,
                store, or have access to any of your documents or their contents.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
                How It Works
              </h2>
              <p className="mb-3">
                When you upload a PDF to this tool:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>The file is processed locally using JavaScript running in your web browser</li>
                <li>All annotation extraction happens on your device</li>
                <li>No data is transmitted to external servers</li>
                <li>Once you close or refresh the page, the file is removed from browser memory</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
                Data We Collect
              </h2>
              <p className="mb-3">
                <strong style={{ color: 'var(--color-ink)' }}>From your PDF files:</strong> Nothing.
                We have no ability to access your files.
              </p>
              <p>
                <strong style={{ color: 'var(--color-ink)' }}>Website analytics:</strong> We may
                collect basic, anonymized usage statistics (such as page views) to understand
                how the tool is used. This data contains no personal information and cannot
                be linked to individual users.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
                Contact
              </h2>
              <p>
                If you have questions about this privacy policy, please contact us through
                the channels provided on the About page.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
