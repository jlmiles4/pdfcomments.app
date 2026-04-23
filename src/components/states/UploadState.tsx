/**
 * Upload state: initial landing view with headline, dropzone, and feature cards.
 */

'use client';

import {
  CheckCircle2,
  Highlighter,
  StickyNote,
  Strikethrough,
  Underline,
} from 'lucide-react';
import { DropZone } from '@/components/DropZone';

interface UploadStateProps {
  onFileSelect: (file: File) => void;
}

export function UploadState({ onFileSelect }: UploadStateProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
          Extract comments from reviewed PDFs
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>
          Turn highlights, sticky notes, and editorial marks into structured Markdown or plain text
        </p>
      </div>

      <DropZone onFileSelect={onFileSelect} />

      <div className="grid sm:grid-cols-2 gap-4">
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
  );
}
