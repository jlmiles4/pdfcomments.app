/**
 * PDF annotation extraction logic.
 *
 * This module provides the core functionality for extracting various types
 * of annotations from PDF documents, including:
 * - Markup annotations: Highlight, StrikeOut, Underline
 * - Shape annotations: Circle, Square
 * - Note annotations: Text (sticky notes), FreeText (text boxes)
 *
 * The extraction process involves:
 * 1. Iterating through all pages
 * 2. Extracting annotation metadata and geometry
 * 3. For markup annotations, finding the text covered by the annotation
 */

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { ExtractedAnnotation, AnnotationType, Rect } from '@/types';
import { quadPointsToRects, rectsIntersect, mergeRects } from './geometry';

/**
 * Represents a text item from PDF.js text content extraction.
 */
interface TextItem {
  /** The actual text string */
  str: string;
  /** Transformation matrix [scaleX, skewX, skewY, scaleY, translateX, translateY] */
  transform: number[];
  /** Width of the text in PDF units */
  width: number;
  /** Height of the text in PDF units */
  height: number;
}

/** Annotation types that mark text (have underlying text) */
const MARKUP_TYPES = ['Highlight', 'StrikeOut', 'Underline'];

/** Annotation types that are geometric shapes */
const SHAPE_TYPES = ['Circle', 'Square'];

/**
 * Extracts all annotations from a PDF document.
 *
 * Iterates through all pages, extracting supported annotation types
 * and their associated data (text, comments, positions).
 *
 * @param pdf - PDFDocumentProxy from PDF.js
 * @param onProgress - Optional callback for progress updates (page, total)
 * @returns Promise resolving to array of extracted annotations
 *
 * @example
 * ```ts
 * const pdf = await loadPdf(file);
 * const annotations = await extractAnnotations(pdf, (page, total) => {
 *   console.log(`Processing page ${page} of ${total}`);
 * });
 * ```
 */
export async function extractAnnotations(
  pdf: PDFDocumentProxy,
  onProgress?: (page: number, total: number) => void
): Promise<ExtractedAnnotation[]> {
  const annotations: ExtractedAnnotation[] = [];
  const numPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(pageNum, numPages);

    // Isolate per-page failures so a single corrupt page doesn't abort the
    // whole extraction — users get partial results plus a console warning
    // they can report, instead of a blanket "Failed to process PDF".
    try {
      const page = await pdf.getPage(pageNum);
      const pageAnnotations = await extractPageAnnotations(page, pageNum);
      annotations.push(...pageAnnotations);
    } catch (err) {
      console.warn(`Skipping page ${pageNum} due to extraction error:`, err);
    }
  }

  return annotations;
}

/**
 * Extracts annotations from a single PDF page.
 *
 * @param page - PDF page proxy
 * @param pageNum - Page number (1-indexed)
 * @returns Array of annotations found on this page
 */
async function extractPageAnnotations(
  page: PDFPageProxy,
  pageNum: number
): Promise<ExtractedAnnotation[]> {
  const rawAnnotations = await page.getAnnotations();
  if (rawAnnotations.length === 0) return [];

  // Only markup annotations need the page's text content. Skip the (relatively
  // expensive) text extraction entirely on pages with none, and precompute each
  // text item's rect once so every markup annotation reuses it.
  const hasMarkup = rawAnnotations.some((annot) =>
    MARKUP_TYPES.includes(annot.subtype as string)
  );
  const textPieces = hasMarkup
    ? buildTextPieces((await page.getTextContent()).items as TextItem[])
    : [];

  const pageHeight = page.getViewport({ scale: 1 }).height;
  const annotations: ExtractedAnnotation[] = [];

  for (const annot of rawAnnotations) {
    const subtype = annot.subtype as string;

    let extracted: ExtractedAnnotation | null = null;
    if (MARKUP_TYPES.includes(subtype)) {
      extracted = extractMarkupAnnotation(annot, subtype as AnnotationType, pageNum, textPieces);
    } else if (SHAPE_TYPES.includes(subtype)) {
      extracted = extractShapeAnnotation(annot, subtype as AnnotationType, pageNum);
    } else if (subtype === 'Text') {
      extracted = extractNoteAnnotation(annot, pageNum, 'Text', { width: 24, height: 24 });
    } else if (subtype === 'FreeText') {
      extracted = extractNoteAnnotation(annot, pageNum, 'FreeText', { width: 100, height: 20 });
    }

    if (extracted) annotations.push({ ...extracted, pageHeight });
  }

  return annotations;
}

/**
 * Extracts a markup annotation (Highlight, StrikeOut, Underline).
 *
 * Finds the text covered by the annotation using quad points or rect.
 *
 * @param annot - Raw annotation object from PDF.js
 * @param type - The annotation type
 * @param page - Page number
 * @param textPieces - Precomputed per-page text pieces for intersection testing
 * @returns Extracted annotation or null if invalid
 */
function extractMarkupAnnotation(
  annot: Record<string, unknown>,
  type: AnnotationType,
  page: number,
  textPieces: TextPiece[]
): ExtractedAnnotation | null {
  let rect: Rect;
  let originalText = '';

  // Use quadPoints if available (more accurate), otherwise use rect
  if (annot.quadPoints && Array.isArray(annot.quadPoints)) {
    const rects = quadPointsToRects(annot.quadPoints as number[]);
    rect = mergeRects(rects);
    originalText = findTextUnderRects(textPieces, rects);
  } else {
    const fallback = rectFromPdfRect(annot.rect);
    if (!fallback) return null;
    rect = fallback;
    originalText = findTextUnderRects(textPieces, [rect]);
  }

  const comment = extractCommentText(annot);

  return {
    type,
    originalText: originalText.trim(),
    comment: comment.trim(),
    page,
    rect,
  };
}

/**
 * Extracts a shape annotation (Circle, Square).
 *
 * @param annot - Raw annotation object from PDF.js
 * @param type - The annotation type
 * @param page - Page number
 * @returns Extracted annotation or null if invalid
 */
function extractShapeAnnotation(
  annot: Record<string, unknown>,
  type: AnnotationType,
  page: number
): ExtractedAnnotation | null {
  const rect = rectFromPdfRect(annot.rect);
  if (!rect) return null;

  const comment = extractCommentText(annot);

  return {
    type,
    originalText: '',
    comment: comment.trim(),
    page,
    rect,
  };
}

/**
 * Extracts a note-style annotation: a sticky note (`Text`) or an inline text
 * box (`FreeText`).
 *
 * Both carry their content in the comment and have no underlying marked text;
 * they differ only in the default box size used when the annotation omits a
 * usable rect. Dropped when the comment is empty.
 *
 * @param annot - Raw annotation object from PDF.js
 * @param page - Page number
 * @param type - 'Text' (sticky note) or 'FreeText' (text box)
 * @param defaults - Fallback box size when the rect is missing or zero-sized
 * @returns Extracted annotation or null if no comment
 */
function extractNoteAnnotation(
  annot: Record<string, unknown>,
  page: number,
  type: 'Text' | 'FreeText',
  defaults: { width: number; height: number }
): ExtractedAnnotation | null {
  const comment = extractCommentText(annot).trim();

  if (!comment) return null;

  const rect = rectFromPdfRect(annot.rect, defaults) ?? {
    x: 0,
    y: 0,
    width: defaults.width,
    height: defaults.height,
  };

  return {
    type,
    originalText: '',
    comment,
    page,
    rect,
  };
}

/**
 * A text item reduced to the geometry and string needed for intersection
 * testing. Built once per page by {@link buildTextPieces} and reused across all
 * markup annotations on that page.
 */
interface TextPiece {
  rect: Rect;
  str: string;
}

/**
 * Precomputes each PDF text item's bounding rect once per page, so markup
 * annotations can be tested without rebuilding the rects on every call.
 *
 * @param textItems - Text items from PDF.js `getTextContent()` (document order)
 * @returns Text pieces in document order
 */
function buildTextPieces(textItems: TextItem[]): TextPiece[] {
  return textItems.map((item) => {
    // Text transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
    const transform = item.transform;
    const height = item.height || Math.abs(transform[3]) || 12;
    return {
      rect: { x: transform[4], y: transform[5], width: item.width, height },
      str: item.str,
    };
  });
}

/**
 * Combines the text of every page text piece that intersects one of the given
 * rectangles, preserving document order and inserting spaces between pieces.
 *
 * @param textPieces - Precomputed per-page text pieces (document order)
 * @param rects - Rectangles to test for intersection
 * @returns Combined text from all intersecting pieces
 */
function findTextUnderRects(textPieces: TextPiece[], rects: Rect[]): string {
  let result = '';
  let emitted = 0;

  for (const piece of textPieces) {
    const hit = rects.some((annotRect) => rectsIntersect(piece.rect, annotRect));
    if (!hit) continue;

    const text = piece.str;
    if (emitted > 0 && !result.endsWith(' ') && !text.startsWith(' ')) {
      result += ' ';
    }
    result += text;
    emitted++;
  }

  return result;
}

/**
 * Extracts the comment text from an annotation.
 *
 * Handles both contentsObj (object with str property) and contents (string).
 *
 * @param annot - Raw annotation object
 * @returns Comment text or empty string
 */
function extractCommentText(annot: Record<string, unknown>): string {
  if (typeof annot.contentsObj === 'object' && annot.contentsObj) {
    return (annot.contentsObj as { str?: string }).str || '';
  }
  if (typeof annot.contents === 'string') {
    return annot.contents;
  }
  return '';
}

/**
 * Converts a PDF `/Rect` array (`[x1, y1, x2, y2]`, corners in any order) into a
 * normalized {@link Rect}. When `defaults` is supplied, a zero-width or
 * zero-height result falls back to the default dimension — used by note-style
 * annotations whose rect is sometimes a degenerate point.
 *
 * @param raw - The annotation's `rect` value (validated as a number array)
 * @param defaults - Optional fallback dimensions for a degenerate rect
 * @returns Normalized Rect, or null if `raw` is not an array
 */
function rectFromPdfRect(
  raw: unknown,
  defaults?: { width: number; height: number }
): Rect | null {
  if (!Array.isArray(raw)) return null;
  const [x1, y1, x2, y2] = raw as number[];
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: defaults ? width || defaults.width : width,
    height: defaults ? height || defaults.height : height,
  };
}
