/**
 * Geometry utilities for PDF annotation processing.
 *
 * This module provides functions for working with rectangles in PDF coordinate space,
 * including converting PDF quad points to rectangles, intersection testing, and
 * distance calculations for proximity-based annotation grouping.
 */

import type { Rect } from '@/types';

/**
 * Converts PDF quad points to an array of rectangles.
 *
 * PDF quad points define the corners of a quadrilateral (8 numbers per quad):
 * x1,y1,x2,y2,x3,y3,x4,y4 representing corners in order:
 * top-left, top-right, bottom-left, bottom-right.
 *
 * This function converts each quad to an axis-aligned bounding rectangle.
 *
 * @param quadPoints - Array of quad point coordinates
 * @returns Array of bounding rectangles, one per quad
 */
export function quadPointsToRects(quadPoints: number[]): Rect[] {
  const rects: Rect[] = [];

  for (let i = 0; i < quadPoints.length; i += 8) {
    const x1 = quadPoints[i];
    const y1 = quadPoints[i + 1];
    const x2 = quadPoints[i + 2];
    const y2 = quadPoints[i + 3];
    const x3 = quadPoints[i + 4];
    const y3 = quadPoints[i + 5];
    const x4 = quadPoints[i + 6];
    const y4 = quadPoints[i + 7];

    const minX = Math.min(x1, x2, x3, x4);
    const maxX = Math.max(x1, x2, x3, x4);
    const minY = Math.min(y1, y2, y3, y4);
    const maxY = Math.max(y1, y2, y3, y4);

    rects.push({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    });
  }

  return rects;
}

/**
 * Checks if two rectangles intersect (overlap).
 *
 * Uses the separating axis theorem: two rectangles don't intersect
 * if there's a gap between them along either the x or y axis.
 *
 * @param a - First rectangle
 * @param b - Second rectangle
 * @returns True if rectangles overlap, false otherwise
 */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Calculates the center point of a rectangle.
 *
 * @param rect - Rectangle to find center of
 * @returns Object with x and y coordinates of the center
 */
export function rectCenter(rect: Rect): { x: number; y: number } {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Calculates the Euclidean distance between the centers of two rectangles.
 *
 * Used for proximity-based grouping of annotations with nearby sticky notes.
 *
 * @param a - First rectangle
 * @param b - Second rectangle
 * @returns Distance in PDF units between rectangle centers
 */
export function distance(a: Rect, b: Rect): number {
  const centerA = rectCenter(a);
  const centerB = rectCenter(b);

  return Math.sqrt(
    Math.pow(centerA.x - centerB.x, 2) +
    Math.pow(centerA.y - centerB.y, 2)
  );
}

/**
 * Merges multiple rectangles into a single bounding rectangle.
 *
 * Creates the smallest axis-aligned rectangle that contains all input rectangles.
 * Used to combine multiple quad regions (e.g., multi-line highlights) into one.
 *
 * @param rects - Array of rectangles to merge
 * @returns Single bounding rectangle, or zero-size rect if input is empty
 */
export function mergeRects(rects: Rect[]): Rect {
  if (rects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
