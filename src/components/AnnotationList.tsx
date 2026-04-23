/**
 * AnnotationList: renders extracted annotations as a summary grid and card list.
 *
 * Shows per-type counts at the top, then an ordered list of annotation cards
 * with the marked text, reviewer comment, and any linked sticky notes.
 */

'use client';

import type { GroupedAnnotation, AnnotationType } from '@/types';
import {
  Highlighter,
  Strikethrough,
  Underline,
  Circle,
  Square,
  StickyNote,
  Type,
  Pencil,
} from 'lucide-react';

interface AnnotationListProps {
  annotations: GroupedAnnotation[];
}

const TYPE_CONFIG: Record<
  AnnotationType,
  { icon: typeof Highlighter; badge: string; label: string }
> = {
  Highlight: { icon: Highlighter, badge: 'badge-highlight', label: 'Highlight' },
  StrikeOut: { icon: Strikethrough, badge: 'badge-strikeout', label: 'Strikeout' },
  Underline: { icon: Underline, badge: 'badge-underline', label: 'Underline' },
  Circle: { icon: Circle, badge: 'badge-circle', label: 'Circle' },
  Square: { icon: Square, badge: 'badge-square', label: 'Square' },
  Text: { icon: StickyNote, badge: 'badge-text', label: 'Note' },
  FreeText: { icon: Type, badge: 'badge-freetext', label: 'Free Text' },
  Ink: { icon: Pencil, badge: 'badge-ink', label: 'Ink' },
};

function TypeBadge({ type }: { type: AnnotationType }) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <span className={`badge ${config.badge}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
}

function AnnotationCard({ annotation }: { annotation: GroupedAnnotation }) {
  const hasText = annotation.originalText.length > 0;
  const hasComment = annotation.comment.length > 0;
  const hasLinkedNotes = annotation.linkedNotes.length > 0;

  return (
    <div
      className="p-4 rounded-lg border"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <TypeBadge type={annotation.type} />
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Page {annotation.page}
        </span>
      </div>

      {hasText && (
        <blockquote
          className="pl-3 mb-2 text-sm"
          style={{
            borderLeft: '2px solid var(--color-border-strong)',
            color: 'var(--color-ink-light)'
          }}
        >
          &ldquo;{annotation.originalText}&rdquo;
        </blockquote>
      )}

      {hasComment && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          <span className="font-medium" style={{ color: 'var(--color-ink)' }}>Comment:</span> {annotation.comment}
        </p>
      )}

      {hasLinkedNotes && (
        <div className="mt-2 space-y-1">
          {annotation.linkedNotes.map((note, idx) => (
            <p
              key={idx}
              className="text-sm flex items-start gap-1"
              style={{ color: 'var(--color-muted)' }}
            >
              <StickyNote className="w-3 h-3 mt-1 flex-shrink-0" style={{ color: 'var(--color-note)' }} />
              <span>{note}</span>
            </p>
          ))}
        </div>
      )}

      {!hasText && !hasComment && !hasLinkedNotes && (
        <p className="text-sm italic" style={{ color: 'var(--color-muted)' }}>
          No text content
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  count,
  type,
}: {
  label: string;
  count: number;
  type: AnnotationType;
}) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className="p-4 rounded-lg border flex items-center gap-3"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className={`p-2 rounded-lg ${config.badge}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>{count}</p>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

export function AnnotationList({ annotations }: AnnotationListProps) {
  const counts = annotations.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<AnnotationType, number>
  );

  const typeOrder: AnnotationType[] = [
    'Highlight',
    'StrikeOut',
    'Underline',
    'Text',
    'FreeText',
    'Circle',
    'Square',
    'Ink',
  ];

  const presentTypes = typeOrder.filter((t) => counts[t] > 0);

  return (
    <div className="space-y-6">
      {/* Summary statistics */}
      {presentTypes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {presentTypes.slice(0, 4).map((type) => (
            <StatCard
              key={type}
              type={type}
              count={counts[type]}
              label={TYPE_CONFIG[type].label}
            />
          ))}
        </div>
      )}

      {/* Annotation list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
          All Annotations ({annotations.length})
        </h2>
        {annotations.map((annotation, idx) => (
          <AnnotationCard
            key={`${annotation.page}-${annotation.type}-${annotation.rect.x}-${annotation.rect.y}-${idx}`}
            annotation={annotation}
          />
        ))}
      </div>
    </div>
  );
}
