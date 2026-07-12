import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Link as LinkIcon, AlertCircle, FileImage, Clipboard } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  maxSizeMB?: number;
}

export default function UploadZone({ onFilesSelected, maxSizeMB = 100 }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set up global paste listener to support pasting images from clipboard anywhere on the page
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        onFilesSelected(e.clipboardData.files);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Support importing images directly via URL
  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setUrlError(null);
    setIsFetchingUrl(true);

    try {
      // Validate string is a URL
      const url = new URL(urlInput);
      const response = await fetch(url.toString(), { mode: 'cors' }).catch(() => null);

      if (!response) {
        // Fallback for CORS: generate a canvas image or explain to user
        throw new Error("Unable to fetch due to CORS restriction. Try downloading the image or pasting it directly!");
      }

      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error("The specified URL does not point to a valid image file.");
      }

      // Create a File object from blob
      const pathname = url.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1) || 'imported_image.png';
      const file = new File([blob], filename, { type: blob.type });

      onFilesSelected([file]);
      setUrlInput('');
    } catch (err: any) {
      console.error(err);
      setUrlError(err.message || "Failed to load image from URL. CORS restrictions may apply.");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" id="upload-zone-wrapper">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`relative overflow-hidden cursor-pointer rounded-[2.5rem] border-3 border-dashed p-12 text-center transition-all duration-300 shadow-xl ${
          isDragging
            ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 scale-[1.01]'
            : 'border-blue-200/80 hover:border-blue-400 bg-white/40 hover:bg-white/60 dark:border-zinc-800/40 dark:bg-zinc-950/15 dark:hover:bg-zinc-950/30 backdrop-blur-xl'
        }`}
        id="drag-drop-container"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
          id="file-input-element"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className={`p-5 rounded-2xl transition-all duration-300 ${
              isDragging 
                ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' 
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
            }`}>
              <UploadCloud className="w-10 h-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-emerald-500 text-white border border-white dark:border-zinc-900">
              <Clipboard className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Drag &amp; drop your images here
            </h3>
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Or <span className="text-blue-600 dark:text-blue-400 hover:underline">browse files</span> from your device, or press <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-[10px] font-bold">Ctrl+V</kbd> to paste from your clipboard.
            </p>
          </div>

          {/* Supported formats showcase */}
          <div className="pt-4 flex flex-wrap justify-center gap-1.5 max-w-lg">
            {['PNG', 'JPG', 'WEBP', 'GIF', 'SVG', 'BMP', 'TIFF', 'ICO'].map((fmt) => (
              <span
                key={fmt}
                className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200/40 dark:border-zinc-700/40"
              >
                {fmt}
              </span>
            ))}
          </div>

          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">
            Maximum single file size: {maxSizeMB} MB. Processed entirely offline.
          </p>
        </div>
      </div>

      {/* URL Import segment */}
      <div className="frosted-card rounded-3xl p-6">
        <form onSubmit={handleUrlImport} className="space-y-3">
          <div className="flex items-center space-x-2">
            <LinkIcon className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
            <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
              Import from URL
            </h4>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste image link (e.g. https://example.com/photo.jpg)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isFetchingUrl || !urlInput.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-900 disabled:cursor-not-allowed text-white transition-colors"
            >
              {isFetchingUrl ? 'Fetching...' : 'Load Image'}
            </button>
          </div>
          {urlError && (
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{urlError}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
