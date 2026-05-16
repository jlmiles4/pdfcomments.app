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
  const annotations: ExtractedAnnotation[] = [];
  const rawAnnotations = await page.getAnnotations();

  // Get text content for finding text under markup annotations
  const textContent = await page.getTextContent();
  const textItems = textContent.items as TextItem[];

  for (const annot of rawAnnotations) {
    const subtype = annot.subtype as string;

    if (MARKUP_TYPES.includes(subtype)) {
      const extracted = await extractMarkupAnnotation(
        annot,
        subtype as AnnotationType,
        pageNum,
        textItems
      );
      if (extracted) annotations.push(extracted);
    } else if (SHAPE_TYPES.includes(subtype)) {
      const extracted = extractShapeAnnotation(
        annot,
        subtype as AnnotationType,
        pageNum
      );
      if (extracted) annotations.push(extracted);
    } else if (subtype === 'Text') {
      const extracted = extractTextAnnotation(annot, pageNum);
      if (extracted) annotations.push(extracted);
    } else if (subtype === 'FreeText') {
      const extracted = extractFreeTextAnnotation(annot, pageNum);
      if (extracted) annotations.push(extracted);
    }
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
 * @param textItems - Text items from the page for text extraction
 * @returns Extracted annotation or null if invalid
 */
async function extractMarkupAnnotation(
  annot: Record<string, unknown>,
  type: AnnotationType,
  page: number,
  textItems: TextItem[]
): Promise<ExtractedAnnotation | null> {
  let rect: Rect;
  let originalText = '';

  // Use quadPoints if available (more accurate), otherwise use rect
  if (annot.quadPoints && Array.isArray(annot.quadPoints)) {
    const rects = quadPointsToRects(annot.quadPoints as number[]);
    rect = mergeRects(rects);
    originalText = findTextUnderRects(textItems, rects);
  } else if (annot.rect && Array.isArray(annot.rect)) {
    const [x1, y1, x2, y2] = annot.rect as number[];
    rect = {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    };
    originalText = findTextUnderRects(textItems, [rect]);
  } else {
    return null;
  }

  const comment = extractCommentText(annot);

  return {
    type,
    originalText: originalText.trim(),
    comment: comment.trim(),
    page,
    rect,
    color: extractColor(annot),
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
  if (!annot.rect || !Array.isArray(annot.rect)) {
    return null;
  }

  const [x1, y1, x2, y2] = annot.rect as number[];
  const rect: Rect = {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };

  const comment = extractCommentText(annot);

  return {
    type,
    originalText: '',
    comment: comment.trim(),
    page,
    rect,
    color: extractColor(annot),
  };
}

/**
 * Extracts a sticky note (Text) annotation.
 *
 * @param annot - Raw annotation object from PDF.js
 * @param page - Page number
 * @returns Extracted annotation or null if no comment
 */
function extractTextAnnotation(
  annot: Record<string, unknown>,
  page: number
): ExtractedAnnotation | null {
  const comment = extractCommentText(annot);

  if (!comment) return null;

  let rect: Rect = { x: 0, y: 0, width: 24, height: 24 };
  if (annot.rect && Array.isArray(annot.rect)) {
    const [x1, y1, x2, y2] = annot.rect as number[];
    rect = {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1) || 24,
      height: Math.abs(y2 - y1) || 24,
    };
  }

  return {
    type: 'Text',
    originalText: '',
    comment: comment.trim(),
    page,
    rect,
    color: extractColor(annot),
  };
}

/**
 * Extracts a free text (text box) annotation.
 *
 * @param annot - Raw annotation object from PDF.js
 * @param page - Page number
 * @returns Extracted annotation or null if no comment
 */
function extractFreeTextAnnotation(
  annot: Record<string, unknown>,
  page: number
): ExtractedAnnotation | null {
  const comment = extractCommentText(annot);

  if (!comment) return null;

  let rect: Rect = { x: 0, y: 0, width: 100, height: 20 };
  if (annot.rect && Array.isArray(annot.rect)) {
    const [x1, y1, x2, y2] = annot.rect as number[];
    rect = {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1) || 100,
      height: Math.abs(y2 - y1) || 20,
    };
  }

  return {
    type: 'FreeText',
    originalText: '',
    comment: comment.trim(),
    page,
    rect,
    color: extractColor(annot),
  };
}

/**
 * Finds text that intersects with the given rectangles.
 *
 * Uses the text transform to determine position and compares with
 * annotation rectangles to find overlapping text.
 *
 * @param textItems - Array of text items from PDF.js
 * @param rects - Rectangles to check for text intersection
 * @returns Combined text from all intersecting items
 */
function findTextUnderRects(textItems: TextItem[], rects: Rect[]): string {
  const matchingItems: { item: TextItem; index: number }[] = [];

  textItems.forEach((item, index) => {
    // Text transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
    const transform = item.transform;
    const x = transform[4];
    const y = transform[5];
    const height = item.height || Math.abs(transform[3]) || 12;
    const width = item.width;

    const textRect: Rect = { x, y, width, height };

    for (const annotRect of rects) {
      if (rectsIntersect(textRect, annotRect)) {
        matchingItems.push({ item, index });
        break;
      }
    }
  });

  // Sort by original document order
  matchingItems.sort((a, b) => a.index - b.index);

  // Combine text, adding spaces between separate items
  let result = '';
  for (let i = 0; i < matchingItems.length; i++) {
    const text = matchingItems[i].item.str;
    if (i > 0 && !result.endsWith(' ') && !text.startsWith(' ')) {
      result += ' ';
    }
    result += text;
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
 * Extracts the color from an annotation.
 *
 * Converts PDF color (0-1 range) to CSS rgb() format.
 *
 * @param annot - Raw annotation object
 * @returns CSS rgb() color string or undefined
 */
function extractColor(annot: Record<string, unknown>): string | undefined {
  if (annot.color && Array.isArray(annot.color) && annot.color.length >= 3) {
    const [r, g, b] = annot.color as number[];
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  }
  return undefined;
}
