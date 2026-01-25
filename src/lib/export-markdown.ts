/**
 * Markdown export utilities.
 *
 * This module provides functions to convert extracted annotations
 * into Markdown format optimized for:
 * - Human readability
 * - AI agent processing (clear structure, location context)
 * - Task tracking and iteration workflows
 */

import type { GroupedAnnotation, AnnotationType } from '@/types';

/**
 * Maps annotation types to human-readable action descriptions.
 * Helps AI agents understand what kind of change is being requested.
 */
const TYPE_ACTIONS: Record<AnnotationType, string> = {
  Highlight: 'Review highlighted text',
  StrikeOut: 'Delete or revise struck-through text',
  Underline: 'Review underlined text',
  Circle: 'Review circled area',
  Square: 'Review boxed area',
  Text: 'Address comment',
  FreeText: 'Address text note',
  Ink: 'Review marked area',
};

/**
 * Describes the vertical position on a page based on y-coordinate.
 * PDF coordinates have origin at bottom-left, so higher y = higher on page.
 */
function describePosition(rect: { y: number; height: number }, pageHeight = 792): string {
  // Estimate position (assuming standard letter page ~792 points)
  const centerY = rect.y + rect.height / 2;
  const relativePosition = centerY / pageHeight;

  if (relativePosition > 0.66) {
    return 'top';
  } else if (relativePosition > 0.33) {
    return 'middle';
  } else {
    return 'bottom';
  }
}

/**
 * Converts annotations to a detailed Markdown format optimized for AI agents.
 *
 * The output includes:
 * - Clear numbering for reference
 * - Page and position information for locating annotations
 * - Separation between marked content and reviewer feedback
 * - Action hints based on annotation type
 *
 * @param annotations - Array of grouped annotations
 * @param documentName - Optional document name for context
 * @returns Markdown string with detailed, structured format
 */
export function toMarkdownTable(
  annotations: GroupedAnnotation[],
  documentName?: string
): string {
  if (annotations.length === 0) {
    return '# PDF Review Comments\n\nNo annotations found in this document.';
  }

  const lines: string[] = [
    '# PDF Review Comments',
    '',
  ];

  if (documentName) {
    lines.push(`**Document:** ${documentName}`);
    lines.push('');
  }

  lines.push(`**Total comments:** ${annotations.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Group by page
  const byPage: Record<number, GroupedAnnotation[]> = {};
  for (const annotation of annotations) {
    if (!byPage[annotation.page]) {
      byPage[annotation.page] = [];
    }
    byPage[annotation.page].push(annotation);
  }

  const pages = Object.keys(byPage).map(Number).sort((a, b) => a - b);
  let itemNumber = 1;

  for (const page of pages) {
    const pageAnnotations = byPage[page];
    lines.push(`## Page ${page}`);
    lines.push('');

    for (const annotation of pageAnnotations) {
      const position = describePosition(annotation.rect);
      const action = TYPE_ACTIONS[annotation.type];

      lines.push(`### ${itemNumber}. ${annotation.type} (${position} of page)`);
      lines.push('');

      // Location context for finding this annotation
      lines.push(`**Location:** Page ${page}, ${position} section`);
      lines.push(`**Action:** ${action}`);
      lines.push('');

      // The marked/highlighted content (if any)
      if (annotation.originalText) {
        lines.push('**Marked text:**');
        lines.push(`> ${annotation.originalText}`);
        lines.push('');
      }

      // Reviewer's feedback
      const hasComment = annotation.comment.length > 0;
      const hasNotes = annotation.linkedNotes.length > 0;

      if (hasComment || hasNotes) {
        lines.push('**Reviewer feedback:**');

        if (hasComment) {
          lines.push(`- ${annotation.comment}`);
        }

        for (const note of annotation.linkedNotes) {
          lines.push(`- ${note}`);
        }

        lines.push('');
      }

      // If no content at all, indicate it's a marker without comment
      if (!annotation.originalText && !hasComment && !hasNotes) {
        lines.push('*No comment provided - review the marked area in the PDF*');
        lines.push('');
      }

      lines.push('---');
      lines.push('');

      itemNumber++;
    }
  }

  // Summary section for quick reference
  lines.push('## Summary by Type');
  lines.push('');

  const typeCounts: Partial<Record<AnnotationType, number>> = {};
  for (const annotation of annotations) {
    typeCounts[annotation.type] = (typeCounts[annotation.type] || 0) + 1;
  }

  for (const [type, count] of Object.entries(typeCounts)) {
    lines.push(`- **${type}:** ${count}`);
  }

  return lines.join('\n');
}

/**
 * Converts annotations to a concise checklist format.
 *
 * Uses GitHub-flavored Markdown checkboxes for task tracking.
 * Each item includes enough context to locate it in the PDF.
 *
 * @param annotations - Array of grouped annotations
 * @returns Markdown string with checkbox format
 */
export function toMarkdownChecklist(annotations: GroupedAnnotation[]): string {
  if (annotations.length === 0) {
    return '# Review Checklist\n\nNo items to review.';
  }

  const lines: string[] = [
    '# Review Checklist',
    '',
    `${annotations.length} items to address:`,
    '',
  ];

  // Group by page
  const byPage: Record<number, GroupedAnnotation[]> = {};
  for (const annotation of annotations) {
    if (!byPage[annotation.page]) {
      byPage[annotation.page] = [];
    }
    byPage[annotation.page].push(annotation);
  }

  const pages = Object.keys(byPage).map(Number).sort((a, b) => a - b);

  for (const page of pages) {
    const pageAnnotations = byPage[page];
    lines.push(`## Page ${page}`);
    lines.push('');

    for (const annotation of pageAnnotations) {
      const position = describePosition(annotation.rect);
      const textPreview = annotation.originalText
        ? ` "${truncate(annotation.originalText, 50)}"`
        : '';
      const comment = annotation.comment || annotation.linkedNotes[0] || '';
      const commentPreview = comment ? ` — ${truncate(comment, 60)}` : '';

      lines.push(
        `- [ ] **[${annotation.type}]** (${position})${textPreview}${commentPreview}`
      );
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Converts annotations to a structured JSON-like format within Markdown.
 *
 * This format is optimized for AI agents that need to parse
 * and act on individual annotations programmatically.
 *
 * @param annotations - Array of grouped annotations
 * @returns Markdown string with structured data blocks
 */
export function toMarkdownStructured(annotations: GroupedAnnotation[]): string {
  if (annotations.length === 0) {
    return '# PDF Annotations (Structured)\n\nNo annotations found.';
  }

  const lines: string[] = [
    '# PDF Annotations (Structured Format)',
    '',
    'Each annotation below contains structured data for programmatic processing.',
    '',
    '---',
    '',
  ];

  let itemNumber = 1;

  for (const annotation of annotations) {
    const position = describePosition(annotation.rect);

    lines.push(`## Annotation ${itemNumber}`);
    lines.push('');
    lines.push('```yaml');
    lines.push(`id: ${itemNumber}`);
    lines.push(`type: ${annotation.type}`);
    lines.push(`page: ${annotation.page}`);
    lines.push(`position: ${position}`);
    lines.push(`action_required: ${TYPE_ACTIONS[annotation.type]}`);

    if (annotation.originalText) {
      // Use YAML literal block for multiline text
      if (annotation.originalText.includes('\n')) {
        lines.push('marked_text: |');
        for (const line of annotation.originalText.split('\n')) {
          lines.push(`  ${line}`);
        }
      } else {
        lines.push(`marked_text: "${escapeYaml(annotation.originalText)}"`);
      }
    } else {
      lines.push('marked_text: null');
    }

    if (annotation.comment) {
      lines.push(`comment: "${escapeYaml(annotation.comment)}"`);
    } else {
      lines.push('comment: null');
    }

    if (annotation.linkedNotes.length > 0) {
      lines.push('linked_notes:');
      for (const note of annotation.linkedNotes) {
        lines.push(`  - "${escapeYaml(note)}"`);
      }
    } else {
      lines.push('linked_notes: []');
    }

    lines.push('```');
    lines.push('');

    itemNumber++;
  }

  return lines.join('\n');
}

/**
 * Legacy table format for backward compatibility.
 * Consider using toMarkdownTable() for better AI agent support.
 */
export function toMarkdownTableCompact(annotations: GroupedAnnotation[]): string {
  if (annotations.length === 0) {
    return '# PDF Annotations\n\nNo annotations found.';
  }

  const lines: string[] = [
    '# PDF Annotations',
    '',
    `*Extracted ${annotations.length} annotation${annotations.length === 1 ? '' : 's'}*`,
    '',
    '| # | Page | Location | Type | Marked Text | Feedback |',
    '|---|------|----------|------|-------------|----------|',
  ];

  let itemNumber = 1;

  for (const annotation of annotations) {
    const page = annotation.page.toString();
    const position = describePosition(annotation.rect);
    const type = annotation.type;
    const text = escapeMarkdownTable(annotation.originalText || '—');

    const allComments: string[] = [];
    if (annotation.comment) {
      allComments.push(annotation.comment);
    }
    if (annotation.linkedNotes.length > 0) {
      allComments.push(...annotation.linkedNotes);
    }

    const comment = allComments.length > 0
      ? escapeMarkdownTable(allComments.join(' / '))
      : '—';

    lines.push(`| ${itemNumber} | ${page} | ${position} | ${type} | ${text} | ${comment} |`);
    itemNumber++;
  }

  return lines.join('\n');
}

/**
 * Truncates text to a maximum length, adding ellipsis if needed.
 */
function truncate(text: string, maxLength: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.substring(0, maxLength - 3) + '...';
}

/**
 * Escapes special characters for YAML string values.
 */
function escapeYaml(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Escapes special Markdown characters for table cells.
 */
function escapeMarkdownTable(text: string): string {
  return text
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts annotations to plain text format.
 *
 * Simple, readable format without Markdown formatting.
 * Useful for pasting into plain text editors or emails.
 *
 * @param annotations - Array of grouped annotations
 * @returns Plain text string
 */
export function toPlainText(annotations: GroupedAnnotation[]): string {
  if (annotations.length === 0) {
    return 'No annotations found.';
  }

  const lines: string[] = [
    `PDF REVIEW COMMENTS (${annotations.length} total)`,
    '=' .repeat(40),
    '',
  ];

  // Group by page
  const byPage: Record<number, GroupedAnnotation[]> = {};
  for (const annotation of annotations) {
    if (!byPage[annotation.page]) {
      byPage[annotation.page] = [];
    }
    byPage[annotation.page].push(annotation);
  }

  const pages = Object.keys(byPage).map(Number).sort((a, b) => a - b);
  let itemNumber = 1;

  for (const page of pages) {
    const pageAnnotations = byPage[page];
    lines.push(`PAGE ${page}`);
    lines.push('-'.repeat(20));
    lines.push('');

    for (const annotation of pageAnnotations) {
      const position = describePosition(annotation.rect);

      lines.push(`${itemNumber}. [${annotation.type}] (${position} of page)`);

      if (annotation.originalText) {
        lines.push(`   Text: "${annotation.originalText}"`);
      }

      if (annotation.comment) {
        lines.push(`   Comment: ${annotation.comment}`);
      }

      for (const note of annotation.linkedNotes) {
        lines.push(`   Note: ${note}`);
      }

      lines.push('');
      itemNumber++;
    }
  }

  return lines.join('\n');
}
