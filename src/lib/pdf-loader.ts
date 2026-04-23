/**
 * PDF loading utilities using PDF.js.
 *
 * pdfjs-dist references browser-only globals (e.g. DOMMatrix) at module
 * evaluation time, so we import it dynamically to keep it out of Next's
 * static-export prerender pass.
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';

type PdfjsModule = typeof import('pdfjs-dist');

let pdfjsPromise: Promise<PdfjsModule> | null = null;

/**
 * Lazily loads pdfjs-dist and configures its worker. Cached across calls.
 * On failure, the cache is cleared so the next call can retry instead of
 * reusing the rejected promise forever.
 */
function getPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist')
      .then(mod => {
        mod.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        return mod;
      })
      .catch(err => {
        pdfjsPromise = null;
        throw err;
      });
  }
  return pdfjsPromise;
}

/**
 * Loads a PDF file and returns a document proxy.
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
  const pdfjsLib = await getPdfjs();

  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data: typedArray,
    useSystemFonts: true,
  });

  return loadingTask.promise;
}
