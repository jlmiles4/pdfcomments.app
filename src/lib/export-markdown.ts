/**
 * Markdown and HTML export utilities.
 *
 * Converts grouped PDF annotations into formats optimized for different
 * downstream consumers:
 * - Markdown table: detailed, AI-agent-friendly with page locations
 * - Markdown checklist: task-tracking format with GFM checkboxes
 * - HTML checklist: pastes into Google Docs / Word as a formatted list
 */

import type { GroupedAnnotation, AnnotationType } from '@/types';

/**
 * Human-readable action descriptions per annotation type.
 * Included in exports to help AI agents interpret reviewer intent.
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
 * Describes the vertical position of a rectangle on a standard letter page.
 * PDF coordinates have origin at bottom-left (y increases upward), so a higher
 * y value is visually higher on the page.
 */
function describePosition(rect: { y: number; height: number }, pageHeight = 792): string {
  const centerY = rect.y + rect.height / 2;
  const relativePosition = centerY / pageHeight;

  if (relativePosition > 0.66) return 'top';
  if (relativePosition > 0.33) return 'middle';
  return 'bottom';
}

/**
 * Groups annotations by page number, preserving their existing order within each page.
 */
function groupByPage(annotations: GroupedAnnotation[]): { page: number; items: GroupedAnnotation[] }[] {
  const byPage: Record<number, GroupedAnnotation[]> = {};
  for (const annotation of annotations) {
    if (!byPage[annotation.page]) byPage[annotation.page] = [];
    byPage[annotation.page].push(annotation);
  }

  return Object.keys(byPage)
    .map(Number)
    .sort((a, b) => a - b)
    .map(page => ({ page, items: byPage[page] }));
}

/**
 * Escapes HTML special characters so user-supplied strings render as text,
 * not markup, when pasted into HTML-aware consumers (Google Docs, email).
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Converts annotations to a detailed Markdown format with page locations.
 *
 * Optimized for AI agent workflows: each annotation is numbered, labeled with
 * its page/position, and paired with an action hint derived from its type.
 *
 * @param annotations - Grouped annotations to export
 * @param documentName - Optional document name included in the header
 * @returns Markdown string
 */
export function toMarkdownTable(
  annotations: GroupedAnnotation[],
  documentName?: string
): string {
  if (annotations.length === 0) {
    return '# PDF Review Comments\n\nNo annotations found in this document.';
  }

  const lines: string[] = ['# PDF Review Comments', ''];

  if (documentName) {
    lines.push(`**Document:** ${documentName}`);
    lines.push('');
  }

  lines.push(`**Total comments:** ${annotations.length}`);
  lines.push('', '---', '');

  let itemNumber = 1;

  for (const { page, items } of groupByPage(annotations)) {
    lines.push(`## Page ${page}`, '');

    for (const annotation of items) {
      const position = describePosition(annotation.rect);
      const action = TYPE_ACTIONS[annotation.type];

      lines.push(`### ${itemNumber}. ${annotation.type} (${position} of page)`, '');
      lines.push(`**Location:** Page ${page}, ${position} section`);
      lines.push(`**Action:** ${action}`, '');

      if (annotation.originalText) {
        lines.push('**Marked text:**');
        lines.push(`> ${annotation.originalText}`, '');
      }

      const hasComment = annotation.comment.length > 0;
      const hasNotes = annotation.linkedNotes.length > 0;

      if (hasComment || hasNotes) {
        lines.push('**Reviewer feedback:**');
        if (hasComment) lines.push(`- ${annotation.comment}`);
        for (const note of annotation.linkedNotes) {
          lines.push(`- ${note}`);
        }
        lines.push('');
      }

      if (!annotation.originalText && !hasComment && !hasNotes) {
        lines.push('*No comment provided - review the marked area in the PDF*', '');
      }

      lines.push('---', '');
      itemNumber++;
    }
  }

  lines.push('## Summary by Type', '');

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
 * Converts annotations to a concise GitHub-flavored Markdown checklist.
 *
 * Renders as an interactive task list in GitHub and Notion, and as a plain
 * bulleted list elsewhere.
 *
 * @param annotations - Grouped annotations to export
 * @returns Markdown checklist string
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

  for (const { page, items } of groupByPage(annotations)) {
    lines.push(`## Page ${page}`, '');

    for (const annotation of items) {
      const textPreview = annotation.originalText
        ? ` "${annotation.originalText.replace(/\s+/g, ' ').trim()}"`
        : '';
      const comment = annotation.comment || annotation.linkedNotes[0] || '';

      lines.push(`- [ ] **[${annotation.type}]**${textPreview}`);
      if (comment) {
        lines.push(`  - Note: ${comment.replace(/\s+/g, ' ').trim()}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Converts annotations to HTML for rich-text paste targets.
 *
 * Produces semantic `<ul>`/`<li>` markup that renders as a formatted bullet
 * list in Google Docs, Word, and most email clients.
 *
 * @param annotations - Grouped annotations to export
 * @returns HTML string
 */
export function toHtmlChecklist(annotations: GroupedAnnotation[]): string {
  if (annotations.length === 0) {
    return '<p>No annotations found.</p>';
  }

  const lines: string[] = [];

  for (const { page, items } of groupByPage(annotations)) {
    lines.push(`<h2>Page ${page}</h2>`);
    lines.push('<ul>');

    for (const annotation of items) {
      const textPreview = annotation.originalText
        ? ` "${escapeHtml(annotation.originalText.replace(/\s+/g, ' ').trim())}"`
        : '';
      const comment = annotation.comment || annotation.linkedNotes[0] || '';

      if (comment) {
        lines.push(
          `<li><strong>[${annotation.type}]</strong>${textPreview}<ul><li>Note: ${escapeHtml(comment.replace(/\s+/g, ' ').trim())}</li></ul></li>`
        );
      } else {
        lines.push(`<li><strong>[${annotation.type}]</strong>${textPreview}</li>`);
      }
    }

    lines.push('</ul>');
  }

  return lines.join('\n');
}
