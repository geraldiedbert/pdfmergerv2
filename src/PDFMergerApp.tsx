import { useCallback, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import './PDFMergerApp.css';

export interface PDFMergerAppProps {
  onMergedPdfChange?: (base64: string) => void;
}

interface PdfFile {
  id: string;
  name: string;
  bytes: ArrayBuffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.substring(dataUrl.indexOf(',') + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(new Blob([buffer]));
  });
}

export default function PDFMergerApp({ onMergedPdfChange }: PDFMergerAppProps) {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergedBase64, setMergedBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const additions: PdfFile[] = [];
    for (const file of Array.from(fileList)) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) continue;
      const bytes = await file.arrayBuffer();
      additions.push({ id: `${file.name}-${Date.now()}-${Math.random()}`, name: file.name, bytes });
    }
    setFiles((prev) => [...prev, ...additions]);
  }, []);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const moveFile = (index: number, direction: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const merge = async () => {
    if (files.length < 2) {
      setError('Add at least two PDF files to merge.');
      return;
    }
    setMerging(true);
    setError(null);
    try {
      const mergedDoc = await PDFDocument.create();
      for (const file of files) {
        const doc = await PDFDocument.load(file.bytes);
        const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
        pages.forEach((page) => mergedDoc.addPage(page));
      }
      const mergedBytes = await mergedDoc.save();
      const base64 = await arrayBufferToBase64(mergedBytes.buffer as ArrayBuffer);
      setMergedBase64(base64);
      onMergedPdfChange?.(base64);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs.');
    } finally {
      setMerging(false);
    }
  };

  const downloadMerged = () => {
    if (!mergedBase64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${mergedBase64}`;
    link.download = 'merged.pdf';
    link.click();
  };

  return (
    <div className="pdf-merger">
      <h1>PDF Merger</h1>
      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={(e) => addFiles(e.target.files)}
      />
      {error && <p className="pdf-merger__error">{error}</p>}
      <ul className="pdf-merger__list">
        {files.map((file, index) => (
          <li key={file.id}>
            <span>{file.name}</span>
            <div className="pdf-merger__controls">
              <button type="button" onClick={() => moveFile(index, -1)} disabled={index === 0}>
                ↑
              </button>
              <button type="button" onClick={() => moveFile(index, 1)} disabled={index === files.length - 1}>
                ↓
              </button>
              <button type="button" onClick={() => removeFile(file.id)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={merge} disabled={merging || files.length < 2}>
        {merging ? 'Merging…' : 'Merge PDFs'}
      </button>
      {mergedBase64 && (
        <button type="button" onClick={downloadMerged}>
          Download merged.pdf
        </button>
      )}
    </div>
  );
}
