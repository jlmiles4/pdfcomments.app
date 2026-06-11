/**
 * Home page: orchestrates the upload → processing → results flow.
 *
 * Owns the `AppState` machine and the extracted annotations. Rendering of
 * each state lives in dedicated components under `src/components/states/`.
 */

'use client';

import { useCallback, useState } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { ErrorState } from '@/components/states/ErrorState';
import { ProcessingState } from '@/components/states/ProcessingState';
import { ResultsState } from '@/components/states/ResultsState';
import { UploadState } from '@/components/states/UploadState';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { extractAnnotations } from '@/lib/extract-annotations';
import { groupAnnotations } from '@/lib/group-annotations';
import { loadPdf } from '@/lib/pdf-loader';
import type { GroupedAnnotation } from '@/types';

type AppState = 'upload' | 'processing' | 'results' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [annotations, setAnnotations] = useState<GroupedAnnotation[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setState('processing');
    setFileName(file.name);
    setProgress({ current: 0, total: 0 });
    setError(null);

    let pdf: PDFDocumentProxy | null = null;
    try {
      pdf = await loadPdf(file);
      setProgress({ current: 0, total: pdf.numPages });

      const extracted = await extractAnnotations(pdf, (page, total) => {
        setProgress({ current: page, total });
      });

      setAnnotations(groupAnnotations(extracted));
      setState('results');
    } catch (err) {
      console.error('Failed to process PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
      setState('error');
    } finally {
      // Release pdfjs worker resources; the grouped annotations we kept
      // are plain data and no longer reference the PDF document. Guard the
      // cleanup so a destroy() rejection can't mask a successful extraction.
      try {
        await pdf?.destroy();
      } catch (destroyErr) {
        console.warn('Failed to release PDF resources:', destroyErr);
      }
    }
  }, []);

  const handleReset = useCallback(() => {
    setState('upload');
    setAnnotations([]);
    setFileName('');
    setError(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8 flex-1">
        {state === 'upload' && <UploadState onFileSelect={handleFileSelect} />}
        {state === 'processing' && (
          <ProcessingState current={progress.current} total={progress.total} />
        )}
        {state === 'error' && error && <ErrorState message={error} onReset={handleReset} />}
        {state === 'results' && (
          <ResultsState fileName={fileName} annotations={annotations} onReset={handleReset} />
        )}
      </main>

      <Footer />
    </div>
  );
}
