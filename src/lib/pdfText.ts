import { pdfjs } from "react-pdf";

// Keep worker config consistent with PDFViewer
// (react-pdf requires workerSrc to be set for pdfjs operations)
function ensurePdfWorker() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyPdfjs = pdfjs as any;
  if (!anyPdfjs?.GlobalWorkerOptions) return;

  if (!anyPdfjs.GlobalWorkerOptions.workerSrc) {
    anyPdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${anyPdfjs.version}/build/pdf.worker.min.mjs`;
  }
}

export async function extractPdfText(arrayBuffer: ArrayBuffer, opts?: { maxPages?: number }) {
  ensurePdfWorker();

  const maxPages = opts?.maxPages ?? 10;
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const doc = await loadingTask.promise;

  const pageCount = Math.min(doc.numPages, maxPages);
  const chunks: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) chunks.push(pageText);
  }

  return chunks.join("\n\n").trim();
}

export function isUsableText(text?: string | null) {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 80) return false;

  // Require a minimum number of real words to avoid "binary decoded as text" gibberish
  const words = trimmed.match(/[A-Za-z]{3,}/g) ?? [];
  if (words.length < 20) return false;

  // Also require a high ratio of readable characters (letters, digits, common punctuation, spaces)
  // Garbled binary-as-text has lots of backticks, tildes, pipes, braces, etc.
  const readableChars = trimmed.match(/[a-zA-Z0-9\s.,!?;:'"()\-@#$%&+=\/]/g)?.length ?? 0;
  const ratio = readableChars / trimmed.length;
  return ratio > 0.65;
}
