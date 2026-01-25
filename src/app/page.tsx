'use client';

import { useState, useCallback } from 'react';
import {
  FileText,
  RefreshCw,
  Highlighter,
  Strikethrough,
  Underline,
  StickyNote,
  CheckCircle2,
  Copy,
  Check,
  FileDown,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DropZone } from '@/components/DropZone';
import { AnnotationList } from '@/components/AnnotationList';
import { loadPdf } from '@/lib/pdf-loader';
import { extractAnnotations } from '@/lib/extract-annotations';
import { groupAnnotations } from '@/lib/group-annotations';
import { toMarkdownTable, toMarkdownChecklist, toHtmlChecklist } from '@/lib/export-markdown';
import type { GroupedAnnotation } from '@/types';

type AppState = 'upload' | 'processing' | 'results' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [annotations, setAnnotations] = useState<GroupedAnnotation[]>([]);
  const [markdown, setMarkdown] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'markdown' | 'checklist' | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setState('processing');
    setFileName(file.name);
    setProgress({ current: 0, total: 0 });
    setError(null);

    try {
      const pdf = await loadPdf(file);
      setProgress({ current: 0, total: pdf.numPages });

      const extracted = await extractAnnotations(pdf, (page, total) => {
        setProgress({ current: page, total });
      });

      const grouped = groupAnnotations(extracted);
      const md = toMarkdownTable(grouped);

      setAnnotations(grouped);
      setMarkdown(md);
      setState('results');
    } catch (err) {
      console.error('Failed to process PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
      setState('error');
    }
  }, []);

  const handleReset = useCallback(() => {
    setState('upload');
    setAnnotations([]);
    setMarkdown('');
    setFileName('');
    setError(null);
    setCopied(null);
  }, []);

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
      setCopied('checklist');
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy checklist:', err);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied('markdown');
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8 flex-1">
        {/* Upload State */}
        {state === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
                Extract comments from reviewed PDFs
              </h1>
              <p style={{ color: 'var(--color-muted)' }}>
                Turn highlights, sticky notes, and editorial marks into structured Markdown or plain text
              </p>
            </div>

            {/* Dropzone */}
            <DropZone onFileSelect={handleFileSelect} />

            {/* Info grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Supported annotations */}
              <div className="card p-4">
                <h3 className="font-medium mb-3" style={{ color: 'var(--color-ink)' }}>
                  Supported
                </h3>
                <div className="space-y-2" style={{ color: 'var(--color-muted)' }}>
                  <div className="flex items-center gap-2">
                    <Highlighter className="w-4 h-4" style={{ color: 'var(--color-highlight)' }} />
                    <span>Highlights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4" style={{ color: 'var(--color-note)' }} />
                    <span>Sticky notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Strikethrough className="w-4 h-4" style={{ color: 'var(--color-strikeout)' }} />
                    <span>Strikethroughs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Underline className="w-4 h-4" style={{ color: 'var(--color-underline)' }} />
                    <span>Underlines</span>
                  </div>
                </div>
              </div>

              {/* Use cases */}
              <div className="card p-4">
                <h3 className="font-medium mb-3" style={{ color: 'var(--color-ink)' }}>
                  Perfect for
                </h3>
                <div className="space-y-2" style={{ color: 'var(--color-muted)' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-square)' }} />
                    <span>Design feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-square)' }} />
                    <span>Editorial reviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-square)' }} />
                    <span>Client comments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-square)' }} />
                    <span>Research notes</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Processing State */}
        {state === 'processing' && (
          <div className="card p-8 max-w-md mx-auto text-center animate-fade-in">
            <div className="animate-spin inline-block mb-4">
              <RefreshCw className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
              Extracting annotations...
            </p>
            {progress.total > 0 && (
              <>
                <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
                  Page {progress.current} of {progress.total}
                </p>
                <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--color-border)' }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                      backgroundColor: 'var(--color-accent)',
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="card p-8 max-w-md mx-auto text-center animate-fade-in">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button onClick={handleReset} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {/* Results State */}
        {state === 'results' && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div
              className="flex items-center justify-between flex-wrap gap-4 pb-4"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <div>
                  <span className="font-medium" style={{ color: 'var(--color-ink)' }}>{fileName}</span>
                  <span className="text-sm ml-2" style={{ color: 'var(--color-muted)' }}>
                    {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <button onClick={handleReset} className="btn-secondary">
                <RefreshCw className="w-4 h-4" />
                New PDF
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
              {/* Annotations list */}
              <div className="lg:col-span-2">
                {annotations.length > 0 ? (
                  <AnnotationList annotations={annotations} />
                ) : (
                  <div className="card p-8 text-center">
                    <p style={{ color: 'var(--color-muted)' }}>
                      No annotations found in this PDF.
                    </p>
                    <button onClick={handleReset} className="btn-primary mt-4">
                      Try Another PDF
                    </button>
                  </div>
                )}
              </div>

              {/* Export sidebar - sticky on desktop */}
              <aside className="space-y-4 lg:sticky lg:top-6">
                {/* Export options */}
                <div className="card p-4">
                  <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--color-ink)' }}>
                    Export
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleCopyChecklist}
                      disabled={annotations.length === 0}
                      className="btn-primary w-full justify-center"
                    >
                      {copied === 'checklist' ? (
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
                      disabled={annotations.length === 0}
                      className="btn-secondary w-full justify-center"
                    >
                      {copied === 'markdown' ? (
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
                      disabled={annotations.length === 0}
                      className="btn-secondary w-full justify-center"
                    >
                      <FileDown className="w-4 h-4" />
                      Download .md
                    </button>
                  </div>
                </div>

                {/* Tips */}
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
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
