/**
 * Processing state: spinner and per-page progress bar shown while a PDF is parsed.
 */

'use client';

import { RefreshCw } from 'lucide-react';

interface ProcessingStateProps {
  current: number;
  total: number;
}

export function ProcessingState({ current, total }: ProcessingStateProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div
      className="card p-8 max-w-md mx-auto text-center animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="animate-spin inline-block mb-4" aria-hidden="true">
        <RefreshCw className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
      </div>
      <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
        Extracting annotations...
      </p>
      {total > 0 && (
        <>
          <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
            Page {current} of {total}
          </p>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="PDF extraction progress"
            className="w-full rounded-full h-1.5"
            style={{ backgroundColor: 'var(--color-border)' }}
          >
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${percent}%`,
                backgroundColor: 'var(--color-accent)',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
