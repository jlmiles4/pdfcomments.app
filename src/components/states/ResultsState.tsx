/**
 * Results state: toolbar, annotation list, and export sidebar shown after extraction.
 */

'use client';

import { FileText, RefreshCw } from 'lucide-react';
import type { GroupedAnnotation } from '@/types';
import { AnnotationList } from '@/components/AnnotationList';
import { ExportSidebar } from './ExportSidebar';

interface ResultsStateProps {
  fileName: string;
  annotations: GroupedAnnotation[];
  onReset: () => void;
}

export function ResultsState({ fileName, annotations, onReset }: ResultsStateProps) {
  return (
    <div className="space-y-6">
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
        <button onClick={onReset} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          New PDF
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          {annotations.length > 0 ? (
            <AnnotationList annotations={annotations} />
          ) : (
            <div className="card p-8 text-center">
              <p style={{ color: 'var(--color-muted)' }}>
                No annotations found in this PDF.
              </p>
              <button onClick={onReset} className="btn-primary mt-4">
                Try Another PDF
              </button>
            </div>
          )}
        </div>

        <ExportSidebar annotations={annotations} fileName={fileName} />
      </div>
    </div>
  );
}
