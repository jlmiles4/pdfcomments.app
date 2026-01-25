/**
 * PDF loading utilities using PDF.js.
 *
 * This module configures the PDF.js library and provides a simple interface
 * for loading PDF files from browser File objects.
 */

import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

/** Tracks whether the PDF.js worker has been initialized */
let workerInitialized = false;

/**
 * Initializes the PDF.js web worker.
 *
 * The worker handles CPU-intensive PDF parsing in a background thread.
 * Only initializes once per session.
 */
function initWorker(): void {
  if (workerInitialized) return;

  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  workerInitialized = true;
}

/**
 * Loads a PDF file and returns a document proxy.
 *
 * Converts the browser File object to an ArrayBuffer, then uses PDF.js
 * to parse it. The returned PDFDocumentProxy provides access to pages
 * and annotations.
 *
 * @param file - Browser File object containing the PDF
 * @returns Promise resolving to PDFDocumentProxy for accessing PDF content
 * @throws Error if the PDF cannot be parsed
 *
 * @example
 * ```ts
 * const pdf = await loadPdf(file);
 * console.log(`PDF has ${pdf.numPages} pages`);
 * ```
 */
export async function loadPdf(file: File): Promise<PDFDocumentProxy> {
  initWorker();

  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data: typedArray,
    useSystemFonts: true,
  });

  return loadingTask.promise;
}
