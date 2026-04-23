/**
 * Export sidebar: copy-to-clipboard and download actions for the current annotations.
 *
 * Owns the clipboard and download side effects so the page shell stays
 * stateless around export concerns.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Copy, FileDown } from 'lucide-react';
import type { GroupedAnnotation } from '@/types';
import {
  toHtmlChecklist,
  toMarkdownChecklist,
  toMarkdownTable,
} from '@/lib/export-markdown';

interface ExportSidebarProps {
  annotations: GroupedAnnotation[];
  fileName?: string;
}

/**
 * Derives a sensible download filename from the source PDF name:
 * `report.pdf` → `report-annotations.md`, falling back to `annotations.md`.
 */
function deriveDownloadName(fileName?: string): string {
  if (!fileName) return 'annotations.md';
  const base = fileName.replace(/\.pdf$/i, '').trim();
  return base ? `${base}-annotations.md` : 'annotations.md';
}

type CopyStatus =
  | { kind: 'idle' }
  | { kind: 'copied'; format: 'markdown' | 'checklist' }
  | { kind: 'error' };

const FEEDBACK_DURATION_MS = 2000;

export function ExportSidebar({ annotations, fileName }: ExportSidebarProps) {
  const [status, setStatus] = useState<CopyStatus>({ kind: 'idle' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEmpty = annotations.length === 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const flash = (next: CopyStatus) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus(next);
    timerRef.current = setTimeout(() => {
      setStatus({ kind: 'idle' });
      timerRef.current = null;
    }, FEEDBACK_DURATION_MS);
  };

  const handleCopyChecklist = async () => {
    try {
      const html = toHtmlChecklist(annotations);
      const gfmChecklist = toMarkdownChecklist(annotations);

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([gfmChecklist], { type: 'text/plain' }),
        }),
      ]);
      flash({ kind: 'copied', format: 'checklist' });
    } catch (err) {
      console.error('Failed to copy checklist:', err);
      flash({ kind: 'error' });
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdownTable(annotations));
      flash({ kind: 'copied', format: 'markdown' });
    } catch (err) {
      console.error('Failed to copy markdown:', err);
      flash({ kind: 'error' });
    }
  };

  const handleDownload = () => {
    const markdown = toMarkdownTable(annotations, fileName);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = deriveDownloadName(fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showChecklistCopied = status.kind === 'copied' && status.format === 'checklist';
  const showMarkdownCopied = status.kind === 'copied' && status.format === 'markdown';

  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      <div className="card p-4">
        <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--color-ink)' }}>
          Export
        </h3>
        <div className="space-y-2">
          <button
            onClick={handleCopyChecklist}
            disabled={isEmpty}
            className="btn-primary w-full justify-center"
          >
            {showChecklistCopied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Checklist
              </>
            )}
          </button>
          <button
            onClick={handleCopyMarkdown}
            disabled={isEmpty}
            className="btn-secondary w-full justify-center"
          >
            {showMarkdownCopied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Markdown
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={isEmpty}
            className="btn-secondary w-full justify-center"
          >
            <FileDown className="w-4 h-4" />
            Download .md
          </button>
        </div>

        {status.kind === 'error' && (
          <div
            role="alert"
            className="mt-3 flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-strikeout)' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Copy failed — try the download button instead.</span>
          </div>
        )}

        {/* Screen-reader-only announcement for successful copies. */}
        <div role="status" aria-live="polite" className="sr-only">
          {status.kind === 'copied' && `Copied ${status.format} to clipboard`}
        </div>
      </div>

      <div
        className="p-3 rounded text-sm space-y-2"
        style={{ backgroundColor: 'var(--color-paper-warm)', color: 'var(--color-muted)' }}
      >
        <p>
          <strong style={{ color: 'var(--color-ink)' }}>Checklist</strong> – Pastes formatted list in Google Docs, checkboxes in GitHub/Notion.
        </p>
        <p>
          <strong style={{ color: 'var(--color-ink)' }}>Markdown</strong> – Detailed format with page locations for AI agents.
        </p>
      </div>
    </aside>
  );
}
