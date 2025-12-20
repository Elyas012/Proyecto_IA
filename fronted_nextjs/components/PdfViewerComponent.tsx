// fronted_nextjs/components/PdfViewerComponent.tsx
import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-pdf components with SSR disabled
const Document = dynamic(() => import('react-pdf').then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false });
const pdfjs = dynamic(() => import('pdfjs-dist/build/pdf'), { ssr: false });

// This line is crucial for react-pdf to find its worker.
// The path might need adjustment based on your project's setup.
// If you encounter issues, try different paths or check react-pdf docs.
if (typeof window !== 'undefined') {
  (pdfjs as any).GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
}

interface PdfViewerProps {
  file: string; // The URL of the PDF file
}

export default function PdfViewerComponent({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on new document load
  }

  const goToPrevPage = () => setPageNumber(prevPage => Math.max(prevPage - 1, 1));
  const goToNextPage = () => setPageNumber(prevPage => Math.min(prevPage + 1, numPages || 1));

  if (!file) {
    return <div className="p-4 text-center text-gray-500">No PDF file selected.</div>;
  }

  const fullPdfUrl = file;

  return (
    <div className="flex flex-col items-center w-full pb-4">
      <div className="mb-4 w-full h-[85vh] overflow-y-auto flex justify-center">
        <Document
          file={fullPdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={console.error}
          className="max-w-full h-auto"
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="border shadow-md"
          />
        </Document>
      </div>
      {numPages && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
            Previous
          </button>
          <span>Page {pageNumber} of {numPages}</span>
          <button onClick={goToNextPage} disabled={pageNumber >= numPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
