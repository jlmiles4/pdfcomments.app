/**
 * Drag-and-drop PDF file picker with validation and large-file confirmation.
 *
 * Accepts a file by drop or file-dialog click, validates it's a PDF, and for
 * files over 50MB prompts the user before handing off to `onFileSelect`.
 */

'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Shield, AlertTriangle } from 'lucide-react';

/** File size threshold (50MB) above which we show a warning */
const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024;

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

export function DropZone({ onFileSelect }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [largeFileWarning, setLargeFileWarning] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Drag events bubble from child elements, so dragLeave fires when the
  // cursor moves onto a child. A counter tracks "enters minus leaves" and
  // only clears the dragging state when the cursor has truly left the root.
  const dragDepth = useRef(0);

  // A drag that ends outside the zone (dropped elsewhere, or cancelled) won't
  // fire our dragLeave, which can leave the counter stuck above zero and the
  // zone stuck in its "dragging" state. Reset on any window-level drop/dragend.
  useEffect(() => {
    const reset = () => {
      dragDepth.current = 0;
      setIsDragging(false);
    };
    window.addEventListener('drop', reset);
    window.addEventListener('dragend', reset);
    return () => {
      window.removeEventListener('drop', reset);
      window.removeEventListener('dragend', reset);
    };
  }, []);

  const validateAndSelect = useCallback(
    (file: File, bypassWarning = false) => {
      setError(null);
      setLargeFileWarning(null);

      if (!file.type && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a PDF file');
        return;
      }

      if (file.type && file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }

      // Check for large files and show warning
      if (!bypassWarning && file.size > LARGE_FILE_THRESHOLD) {
        setLargeFileWarning(file);
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleProceedWithLargeFile = useCallback(() => {
    if (largeFileWarning) {
      validateAndSelect(largeFileWarning, true);
    }
  }, [largeFileWarning, validateAndSelect]);

  const handleCancelLargeFile = useCallback(() => {
    setLargeFileWarning(null);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        validateAndSelect(file);
      }
    },
    [validateAndSelect]
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFileDialog();
      }
    },
    [openFileDialog]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        validateAndSelect(file);
      }
    },
    [validateAndSelect]
  );

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload PDF: drop a file here or press Enter to browse"
        onClick={openFileDialog}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`dropzone ${isDragging ? 'dragging' : ''} p-10`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          tabIndex={-1}
        />

        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="p-4 rounded-xl transition-colors duration-200"
            style={{
              backgroundColor: isDragging ? 'var(--color-accent-soft)' : 'var(--color-paper-warm)',
            }}
          >
            {isDragging ? (
              <FileText
                className="w-8 h-8"
                style={{ color: 'var(--color-accent)' }}
              />
            ) : (
              <Upload
                className="w-8 h-8"
                style={{ color: 'var(--color-muted)' }}
              />
            )}
          </div>

          <div>
            <p className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
              {isDragging ? 'Drop your PDF here' : 'Drop PDF or click to browse'}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
              Works with annotations from Adobe, Preview, Foxit, and more
            </p>
            <p className="mt-3 text-xs flex items-start justify-center gap-1.5" style={{ color: 'var(--color-muted)' }}>
              <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span className="text-center">100% local processing. Your files never leave your browser.</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 text-sm"
          style={{ color: 'var(--color-strikeout)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {largeFileWarning && (
        <div
          className="mt-4 p-4 rounded-lg"
          style={{ backgroundColor: 'var(--color-accent-soft)', border: '1px solid var(--color-accent)' }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
            <div className="flex-1">
              <p className="font-medium" style={{ color: 'var(--color-ink)' }}>
                Large file detected
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                This file is {Math.round(largeFileWarning.size / (1024 * 1024))}MB. Processing may take additional time due to the file size.
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleProceedWithLargeFile}
                  className="btn-primary text-sm py-2 px-4"
                >
                  Continue anyway
                </button>
                <button
                  onClick={handleCancelLargeFile}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
