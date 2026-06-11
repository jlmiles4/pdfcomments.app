/**
 * Type definitions for PDF annotation extraction.
 *
 * This module defines the core data structures used throughout the application
 * for representing PDF annotations and their associated metadata.
 */

/**
 * Supported PDF annotation types.
 * - Markup types: Highlight, StrikeOut, Underline (text-based annotations)
 * - Shape types: Circle, Square (geometric shapes)
 * - Note types: Text (sticky notes), FreeText (text boxes)
 * - Drawing types: Ink (freehand drawings)
 */
export type AnnotationType =
  | 'Highlight'
  | 'StrikeOut'
  | 'Underline'
  | 'Circle'
  | 'Square'
  | 'Text'
  | 'FreeText'
  | 'Ink';

/**
 * Represents a rectangle in PDF coordinate space.
 * PDF coordinates have origin at bottom-left with y increasing upward.
 */
export interface Rect {
  /** X coordinate of the rectangle's left edge */
  x: number;
  /** Y coordinate of the rectangle's bottom edge */
  y: number;
  /** Width of the rectangle */
  width: number;
  /** Height of the rectangle */
  height: number;
}

/**
 * Represents a single annotation extracted from a PDF page.
 */
export interface ExtractedAnnotation {
  /** The type of annotation (e.g., Highlight, Text, Circle) */
  type: AnnotationType;
  /** The text covered by markup annotations (empty for shapes/notes) */
  originalText: string;
  /** User comment attached to the annotation */
  comment: string;
  /** Page number where the annotation appears (1-indexed) */
  page: number;
  /** Bounding rectangle of the annotation in PDF coordinates */
  rect: Rect;
  /** Height of the source page in PDF points, used for vertical-position labels */
  pageHeight?: number;
}

/**
 * Represents an annotation with linked nearby sticky notes.
 * Extends ExtractedAnnotation by grouping related notes based on proximity.
 */
export interface GroupedAnnotation extends ExtractedAnnotation {
  /** Comments from sticky notes found near this annotation */
  linkedNotes: string[];
}
