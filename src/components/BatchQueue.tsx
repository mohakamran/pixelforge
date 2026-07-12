import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RefreshCw, Download, FileSpreadsheet, Plus, AlertCircle, CheckCircle, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { PixelFile, ToolType } from '../types';

interface BatchQueueProps {
  files: PixelFile[];
  onRemoveFile: (id: string) => void;
  onReplaceFile: (id: string, file: File) => void;
  onClearQueue: () => void;
  onSelectFileToEdit: (file: PixelFile) => void;
  onTriggerUpload: () => void;
  onDownloadAllZIP: () => void;
  activeTool: ToolType | null;
  setActiveTool: (tool: ToolType | null) => void;
}

export default function BatchQueue({
  files,
  onRemoveFile,
  onReplaceFile,
  onClearQueue,
  onSelectFileToEdit,
  onTriggerUpload,
  onDownloadAllZIP,
  activeTool,
  setActiveTool,
}: BatchQueueProps) {
  const [bulkPrefix, setBulkPrefix] = useState('pixelforge_export');
  const [isDownloading, setIsDownloading] = useState(false);

  // Calculate stats
  const totalFiles = files.length;
  const totalOriginalBytes = files.reduce((acc, f) => acc + f.originalSize, 0);
  const totalProcessedBytes = files.reduce((acc, f) => acc + (f.processedSize || 0), 0);
  const processedFilesCount = files.filter((f) => f.status === 'completed').length;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getSavings = () => {
    if (totalOriginalBytes === 0) return 0;
    const completedOriginals = files
      .filter((f) => f.status === 'completed')
      .reduce((acc, f) => acc + f.originalSize, 0);
    const completedProcessed = files
      .filter((f) => f.status === 'completed')
      .reduce((acc, f) => acc + (f.processedSize || 0), 0);

    if (completedOriginals === 0) return 0;
    const savings = ((completedOriginals - completedProcessed) / completedOriginals) * 100;
    return savings > 0 ? Math.round(savings) : 0;
  };

  const handleIndividualDownload = (f: PixelFile, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the editor panel when clicking download
    if (!f.processedUrl) return;
    const link = document.createElement('a');
    link.href = f.processedUrl;
    link.download = `${bulkPrefix}_${f.name.substring(0, f.name.lastIndexOf('.')) || f.name}.${f.processedFormat || 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerIndividualFileInput = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (evt: any) => {
      const selectedFile = evt.target.files?.[0];
      if (selectedFile) {
        onReplaceFile(id, selectedFile);
      }
    };
    input.click();
  };

  return (
    <div className="w-full space-y-6" id="batch-queue-dashboard">
      {/* Batch Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 frosted-card p-6 rounded-3xl">
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Queue Total</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{totalFiles} {totalFiles === 1 ? 'Image' : 'Images'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Original Size</p>
          <p className="text-2xl font-black text-gray-950 dark:text-zinc-100">{formatSize(totalOriginalBytes)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Optimized Size</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {processedFilesCount > 0 ? formatSize(totalProcessedBytes) : '--'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Storage Savings</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {getSavings() > 0 ? `${getSavings()}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Toolbox & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/20 dark:bg-zinc-950/15 backdrop-blur-sm border border-slate-200/40 dark:border-zinc-800/40 p-5 rounded-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mr-1">Select Tool:</span>
          {(['compress', 'convert', 'resize', 'crop', 'watermark', 'adjust', 'pdf', 'ai'] as ToolType[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTool(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                activeTool === t
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-white hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-gray-200/50 dark:border-zinc-700/50 text-gray-700 dark:text-zinc-300'
              }`}
            >
              {t === 'pdf' ? 'Images to PDF' : t === 'ai' ? '✨ AI Analyzer' : t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerUpload}
            className="px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 border border-gray-200/50 dark:border-zinc-700/50 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add More</span>
          </button>
          <button
            onClick={onClearQueue}
            className="px-4 py-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 text-gray-500 dark:text-zinc-400 border border-transparent rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Queue Grid */}
      <div className="space-y-3" id="queue-files-list">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Active Workspace Items ({totalFiles})
          </h3>
          <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">
            Click on an item card to edit individually
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {files.map((f, index) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.4) }}
              onClick={() => onSelectFileToEdit(f)}
              className="group frosted-card frosted-card-hover rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all"
            >
              {/* Left Column: Image Meta */}
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-200/20 dark:border-zinc-800/20 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={f.previewUrl}
                    alt={f.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] font-extrabold uppercase bg-black/75 text-white">
                    {f.originalFormat}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[320px]">
                    {f.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-semibold text-gray-400 dark:text-zinc-500">
                    <span>{f.width} × {f.height} px</span>
                    <span>•</span>
                    <span>{formatSize(f.originalSize)}</span>
                    {f.status === 'completed' && f.processedSize && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 rounded">
                          {formatSize(f.processedSize)} ({Math.round(((f.originalSize - f.processedSize) / f.originalSize) * 100)}% smaller)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-gray-100 dark:border-zinc-800 pt-3 sm:pt-0">
                {/* Status indicator */}
                <div className="flex items-center space-x-2">
                  {f.status === 'idle' && (
                    <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800">
                      Idle
                    </span>
                  )}
                  {f.status === 'processing' && (
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/20">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                  {f.status === 'completed' && (
                    <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20">
                      <CheckCircle className="w-3 h-3" />
                      <span>Ready</span>
                    </div>
                  )}
                  {f.status === 'failed' && (
                    <div className="flex items-center space-x-1 text-[10px] font-bold text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/20">
                      <AlertCircle className="w-3 h-3" />
                      <span>Error</span>
                    </div>
                  )}
                </div>

                {/* Individual Action Buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={(e) => triggerIndividualFileInput(f.id, e)}
                    className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="Replace Image"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {f.status === 'completed' && f.processedUrl && (
                    <button
                      onClick={(e) => handleIndividualDownload(f, e)}
                      className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      title="Download File"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(f.id);
                    }}
                    className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global Batch Controls - Only show when we have compiled results */}
      {processedFilesCount > 0 && (
        <div className="frosted-card rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                Batch Rename Template
              </label>
              <input
                type="text"
                placeholder="pixelforge_export"
                value={bulkPrefix}
                onChange={(e) => setBulkPrefix(e.target.value)}
                className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 pt-2 sm:pt-0">
              <button
                onClick={onDownloadAllZIP}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/10 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download All (ZIP)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
