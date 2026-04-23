/**
 * Error state: shown when PDF parsing or annotation extraction fails.
 */

'use client';

interface ErrorStateProps {
  message: string;
  onReset: () => void;
}

export function ErrorState({ message, onReset }: ErrorStateProps) {
  return (
    <div className="card p-8 max-w-md mx-auto text-center animate-fade-in">
      <p role="alert" className="mb-4" style={{ color: 'var(--color-strikeout)' }}>
        {message}
      </p>
      <button onClick={onReset} className="btn-primary">
        Try Again
      </button>
    </div>
  );
}
