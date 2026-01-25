/**
 * Annotation grouping and proximity linking.
 *
 * This module groups annotations by page and links nearby sticky notes
 * to their associated annotations (e.g., a note placed next to a highlight).
 *
 * The proximity threshold determines how close a sticky note must be to
 * an annotation to be considered "linked" to it.
 */

import type { ExtractedAnnotation, GroupedAnnotation } from '@/types';
import { distance } from './geometry';

/**
 * Maximum distance (in PDF units) between an annotation and a sticky note
 * for them to be considered linked. PDF units are typically 1/72 inch.
 */
const PROXIMITY_THRESHOLD = 50;

/**
 * Groups annotations and links nearby sticky notes.
 *
 * Processing steps:
 * 1. Separate Text (sticky note) annotations from others
 * 2. For each page, find sticky notes near other annotations
 * 3. Link nearby notes to their parent annotations
 * 4. Return annotations sorted by page and position
 *
 * @param annotations - Array of extracted annotations
 * @returns Array of grouped annotations with linked notes
 *
 * @example
 * ```ts
 * const extracted = await extractAnnotations(pdf);
 * const grouped = groupAnnotations(extracted);
 * // Highlights now have linkedNotes from nearby sticky notes
 * ```
 */
export function groupAnnotations(
  annotations: ExtractedAnnotation[]
): GroupedAnnotation[] {
  // Separate text annotations (sticky notes) from other annotations
  const textNotes = annotations.filter(a => a.type === 'Text');
  const otherAnnotations = annotations.filter(a => a.type !== 'Text');

  // Group by page for efficient proximity checking
  const pageGroups = groupBy(otherAnnotations, a => a.page);

  const result: GroupedAnnotation[] = [];

  for (const [page, pageAnnotations] of Object.entries(pageGroups)) {
    const pageNum = parseInt(page, 10);
    const pageNotes = textNotes.filter(n => n.page === pageNum);

    for (const annotation of pageAnnotations) {
      // Find nearby sticky notes within proximity threshold
      const linkedNotes: string[] = [];
      const linkedNoteIndices: number[] = [];

      pageNotes.forEach((note, index) => {
        if (distance(annotation.rect, note.rect) < PROXIMITY_THRESHOLD) {
          if (note.comment) {
            linkedNotes.push(note.comment);
          }
          linkedNoteIndices.push(index);
        }
      });

      result.push({
        ...annotation,
        linkedNotes,
      });

      // Remove linked notes from pool (they've been associated)
      // Process in reverse order to maintain valid indices
      for (let i = linkedNoteIndices.length - 1; i >= 0; i--) {
        pageNotes.splice(linkedNoteIndices[i], 1);
      }
    }

    // Add remaining unlinked text notes on this page
    for (const note of pageNotes) {
      result.push({
        ...note,
        linkedNotes: [],
      });
    }
  }

  // Add text notes from pages with no other annotations
  const pagesWithAnnotations = new Set(otherAnnotations.map(a => a.page));
  const orphanNotes = textNotes.filter(n => !pagesWithAnnotations.has(n.page));

  for (const note of orphanNotes) {
    result.push({
      ...note,
      linkedNotes: [],
    });
  }

  // Sort by page, then by y position (top to bottom in visual order)
  // PDF coordinates have y increasing upward, so higher y = higher on page
  result.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return b.rect.y - a.rect.y;
  });

  return result;
}

/**
 * Groups items by a key derived from each item.
 *
 * @param items - Array of items to group
 * @param keyFn - Function that returns the grouping key for an item
 * @returns Object mapping keys to arrays of items
 */
function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string | number
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};

  for (const item of items) {
    const key = String(keyFn(item));
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }

  return groups;
}
