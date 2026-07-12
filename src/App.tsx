import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Shield, Zap, Layers, Crop, RotateCw, Type, Settings, Sliders, Image as ImageIcon, HelpCircle, Info, ChevronDown, Check, Download, RefreshCw, Trash2, Plus, ArrowRight, FileText
} from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UploadZone from './components/UploadZone';
import BatchQueue from './components/BatchQueue';
import ImageEditorPanel from './components/ImageEditorPanel';
import { PixelFile, ToolType, ToolConfig, DEFAULT_CONFIG, DEFAULT_ADJUSTMENTS, DEFAULT_WATERMARK } from './types';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [files, setFiles] = useState<PixelFile[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [selectedFile, setSelectedFile] = useState<PixelFile | null>(null);
  const [globalConfig, setGlobalConfig] = useState<ToolConfig>(DEFAULT_CONFIG);

  // PDF Tool options
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfMargin, setPdfMargin] = useState<number>(10); // in mm
  const [isCompilingPDF, setIsCompilingPDF] = useState(false);

  // FAQ Expand state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // References for scrolling
  const featuresRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFilesSelected = (selectedFiles: FileList | File[]) => {
    Array.from(selectedFiles).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const id = Math.random().toString(36).substring(2, 9);
      const originalFormat = file.name.split('.').pop()?.toLowerCase() || 'png';
      const previewUrl = URL.createObjectURL(file);

      // Read physical size coordinates
      const img = new Image();
      img.onload = () => {
        const newPixelFile: PixelFile = {
          id,
          file,
          name: file.name,
          originalSize: file.size,
          processedSize: null,
          previewUrl,
          processedUrl: null,
          width: img.naturalWidth,
          height: img.naturalHeight,
          originalFormat,
          processedFormat: null,
          status: 'idle',
          progress: 0,
          error: null,
          adjustments: { ...DEFAULT_ADJUSTMENTS },
          watermark: { ...DEFAULT_WATERMARK },
          rotation: 0,
          flipH: false,
          flipV: false,
          cropRect: null,
          aiAnalysis: null,
          aiLoading: false,
        };

        setFiles((prev) => [...prev, newPixelFile]);
      };
      img.src = previewUrl;
    });

    // Automatically transition to the queue view
    setActiveTool(null);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.processedUrl) URL.revokeObjectURL(target.processedUrl);
      }
      return prev.filter((f) => f.id !== id);
    });

    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
  };

  const handleReplaceFile = (id: string, newFile: File) => {
    if (!newFile.type.startsWith('image/')) return;
    const originalFormat = newFile.name.split('.').pop()?.toLowerCase() || 'png';
    const previewUrl = URL.createObjectURL(newFile);

    const img = new Image();
    img.onload = () => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            URL.revokeObjectURL(f.previewUrl);
            if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
            return {
              ...f,
              file: newFile,
              name: newFile.name,
              originalSize: newFile.size,
              processedSize: null,
              previewUrl,
              processedUrl: null,
              width: img.naturalWidth,
              height: img.naturalHeight,
              originalFormat,
              processedFormat: null,
              status: 'idle',
              cropRect: null,
              aiAnalysis: null,
            };
          }
          return f;
        })
      );
    };
    img.src = previewUrl;
  };

  const handleClearQueue = () => {
    files.forEach((f) => {
      URL.revokeObjectURL(f.previewUrl);
      if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
    });
    setFiles([]);
    setSelectedFile(null);
    setActiveTool(null);
  };

  const handleUpdateFile = (updated: PixelFile) => {
    setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    if (selectedFile?.id === updated.id) {
      setSelectedFile(updated);
    }
  };

  // ZIP bulk packing compiler
  const handleDownloadAllZIP = async () => {
    const zip = new JSZip();
    const completedFiles = files.filter((f) => f.status === 'completed' && f.processedUrl);
    if (completedFiles.length === 0) return;

    for (const f of completedFiles) {
      try {
        const response = await fetch(f.processedUrl!);
        const blob = await response.blob();
        const extension = f.processedFormat || f.originalFormat;
        const baseName = f.name.substring(0, f.name.lastIndexOf('.')) || f.name;
        zip.file(`${baseName}.${extension}`, blob);
      } catch (err) {
        console.error('Error adding file to ZIP:', f.name, err);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `pixelforge_bulk_export.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  // PDF compilation compiler
  const handleCompilePDF = async () => {
    const completedFiles = files.filter((f) => f.status === 'completed' && f.processedUrl);
    if (completedFiles.length === 0) return;

    setIsCompilingPDF(true);
    try {
      const doc = new jsPDF({
        orientation: pdfOrientation,
        unit: 'mm',
        format: 'a4',
      });

      for (let i = 0; i < completedFiles.length; i++) {
        const f = completedFiles[i];
        if (i > 0) {
          doc.addPage();
        }

        // Draw image onto PDF
        const img = new Image();
        img.src = f.processedUrl!;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const pageW = pdfOrientation === 'portrait' ? 210 : 297;
        const pageH = pdfOrientation === 'portrait' ? 297 : 210;
        const maxW = pageW - pdfMargin * 2;
        const maxH = pageH - pdfMargin * 2;

        let drawW = maxW;
        let drawH = (img.height / img.width) * drawW;

        if (drawH > maxH) {
          drawH = maxH;
          drawW = (img.width / img.height) * drawH;
        }

        const x = pdfMargin + (maxW - drawW) / 2;
        const y = pdfMargin + (maxH - drawH) / 2;

        const format = f.processedFormat === 'jpg' ? 'JPEG' : 'PNG';
        doc.addImage(f.processedUrl!, format, x, y, drawW, drawH);
      }

      doc.save('pixelforge_compiled_book.pdf');
    } catch (err) {
      console.error('PDF compiling failed:', err);
    } finally {
      setIsCompilingPDF(false);
    }
  };

  // Manual Trigger helper
  const handleTriggerUploadClick = () => {
    const input = document.getElementById('file-input-element');
    input?.click();
  };

  const faqData = [
    {
      q: 'Does PixelForge upload my photos to any server?',
      a: 'No. PixelForge operates 100% in your local browser sandbox. All image manipulation, cropping, resizing, and watermarking happen client-side using JavaScript Canvas APIs. Your original files never leave your device. The only network call made is optionally for the "AI Smart Assistant" to analyze an image, which is securely proxied server-side to the Gemini API and never stores your image.',
    },
    {
      q: 'Can I compress or convert multiple images at once?',
      a: 'Yes, PixelForge has full multi-file support and batch processing. You can drag and drop up to 100+ images into the queue, configure bulk settings, preview files individually, and download everything grouped together in a single ZIP folder.',
    },
    {
      q: 'What is the "AI Smart Assistant" feature?',
      a: 'The AI Smart Assistant uses Google’s Gemini 3.5 Flash model on our server to inspect your image. It generates metadata captions, screen-reader alt text, search tags, and evaluates the visual composition. Most importantly, it calculates ideal adjustment settings (exposure, saturation, temperature) and allows you to apply them as a one-click auto-enhance.',
    },
    {
      q: 'What formats are supported by PixelForge?',
      a: 'We support all major image formats, including PNG, JPG, JPEG, WEBP, GIF, SVG, BMP, and ICO. You can convert interchangeably between any of these output targets and compile them directly into a multi-page PDF document.',
    },
  ];

  return (
    <div className="min-h-screen frosted-glass-bg text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-200/20 dark:bg-blue-950/15 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute top-20 -right-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-950/15 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onScrollToFAQ={() => scrollToRef(faqRef)}
        onScrollToFeatures={() => scrollToRef(featuresRef)}
        onScrollToAbout={() => scrollToRef(aboutRef)}
        onTriggerUpload={handleTriggerUploadClick}
        hasFiles={files.length > 0}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10">
        <AnimatePresence mode="wait">
          {/* VIEW 1: LANDING PAGE (Empty queue) */}
          {files.length === 0 && (
            <motion.div
              key="landing-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-24"
            >
              {/* Hero Header */}
              <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
                <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/30 dark:border-blue-900/30 backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>100% Client-Side Sandbox</span>
                </span>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-gray-950 dark:text-white">
                  Every Image Tool You Need —{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Free, Fast &amp; Private
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 leading-relaxed font-medium max-w-2xl mx-auto">
                  Convert, compress, resize, crop, rotate, watermark, and optimize images directly inside your browser. No accounts, no watermarks, completely offline.
                </p>
              </div>

              {/* Upload Zone Section */}
              <UploadZone onFilesSelected={handleFilesSelected} />

              {/* Popular Tools Grid */}
              <div className="space-y-6" ref={featuresRef}>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Popular Browser Tools</h2>
                  <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                    No uploads, instant CPU execution
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: 'Image Compressor', desc: 'Reduce file size by up to 90% without quality loss.', icon: <Sliders className="text-emerald-500" /> },
                    { title: 'Format Converter', desc: 'Convert JPG, PNG, WEBP, GIF, SVG, BMP, and ICO in seconds.', icon: <Layers className="text-indigo-500" /> },
                    { title: 'Resize / Scaling', desc: 'Quickly set exact widths, heights, percentages, or social presets.', icon: <Settings className="text-blue-500" /> },
                    { title: 'Cropping Suite', desc: 'Crop with precise pre-defined aspect ratios (1:1, 16:9, etc.).', icon: <Crop className="text-purple-500" /> },
                    { title: 'Rotation & Flips', desc: 'Rotate by 90/180/270 degrees or mirror vertically and horizontally.', icon: <RotateCw className="text-pink-500" /> },
                    { title: 'Secure Watermarking', desc: 'Embed text overlays or corporate branding logos with custom opacities.', icon: <Type className="text-amber-500" /> },
                  ].map((tool, idx) => (
                    <div
                      key={idx}
                      onClick={handleTriggerUploadClick}
                      className="group frosted-card frosted-card-hover p-6 rounded-3xl cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/60 dark:bg-zinc-950/60 flex items-center justify-center mb-4 border border-gray-200/20 dark:border-zinc-800/20">
                        {tool.icon}
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported Formats Banner */}
              <div className="frosted-card rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 text-center md:text-left">
                  <h3 className="font-extrabold text-gray-950 dark:text-white text-lg">Multi-format Cross-Conversion</h3>
                  <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                    Switch image encodings instantly in your local system memory.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-xl">
                  {['PNG', 'JPG', 'WEBP', 'GIF', 'SVG', 'BMP', 'TIFF', 'ICO', 'PDF'].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/60 dark:bg-zinc-800/60 border border-gray-200/40 dark:border-zinc-700/40 shadow-xs text-gray-700 dark:text-zinc-300"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div className="space-y-12">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Pure Browser Execution</h2>
                  <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                    3 simple steps to complete optimization
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { step: '01', title: 'Upload Files', desc: 'Drag and drop your images or paste directly from clipboard anywhere on the screen.' },
                    { step: '02', title: 'Optimize & Configure', desc: 'Select individual files, adjust exposure sliders, set watermarks, or cropping boxes.' },
                    { step: '03', title: 'Download Bulk ZIP', desc: 'Get single compiled results or bundle all processes together inside a compressed ZIP package.' },
                  ].map((s, idx) => (
                    <div key={idx} className="space-y-4 relative">
                      <span className="text-4xl font-black text-blue-600/35 dark:text-blue-500/20">{s.step}</span>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{s.title}</h3>
                      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              <div className="space-y-8 max-w-4xl mx-auto" ref={faqRef}>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                  <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                    Learn more about privacy and limits
                  </p>
                </div>

                <div className="space-y-4">
                  {faqData.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="frosted-card rounded-2xl overflow-hidden"
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full px-6 py-4 text-left font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-5 pt-1 text-xs text-gray-500 dark:text-zinc-400 font-semibold leading-relaxed border-t border-gray-200/20 dark:border-zinc-800/20">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* About / Privacy block */}
              <div
                className="p-8 rounded-3xl frosted-card max-w-4xl mx-auto text-center space-y-4"
                ref={aboutRef}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Privacy Sandbox Commitment</h3>
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                  PixelForge is built for speed and security. No cookies, no trackers, no database. Your content remains completely yours. You can even load this page, disconnect your wifi, and continue optimizing images 100% offline.
                </p>
              </div>
            </motion.div>
          )}

          {/* VIEW 2: ACTIVE WORKSPACE (Queue loaded) */}
          {files.length > 0 && (
            <motion.div
              key="active-workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {selectedFile ? (
                /* Detail Image Editing Panel */
                <ImageEditorPanel
                  file={selectedFile}
                  globalConfig={globalConfig}
                  setGlobalConfig={setGlobalConfig}
                  onUpdateFile={handleUpdateFile}
                  onClose={() => setSelectedFile(null)}
                />
              ) : activeTool === 'pdf' ? (
                /* SPECIAL PDF VIEW: Merging pages */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setActiveTool(null)}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-gray-600 dark:text-zinc-400 flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 scale-x-[-1]" />
                      <span>Back to Queue</span>
                    </button>
                    <h2 className="text-sm font-black uppercase tracking-wider text-gray-400">PDF Compilation Suite</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Setup block */}
                    <div className="lg:col-span-5 frosted-card rounded-3xl p-6 space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white">Document Layout</h3>
                        <p className="text-xs text-gray-400 font-semibold">Define PDF compilation dimensions and margins</p>
                      </div>

                      <div className="space-y-4 text-xs font-bold">
                        {/* Orientation */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-wider text-gray-400 block">Orientation</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setPdfOrientation('portrait')}
                              className={`py-2 px-4 rounded-xl border font-bold transition-all cursor-pointer ${
                                pdfOrientation === 'portrait'
                                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600'
                                  : 'border-gray-200/50 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 text-gray-700 dark:text-zinc-300'
                              }`}
                            >
                              Portrait (A4)
                            </button>
                            <button
                              onClick={() => setPdfOrientation('landscape')}
                              className={`py-2 px-4 rounded-xl border font-bold transition-all cursor-pointer ${
                                pdfOrientation === 'landscape'
                                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600'
                                  : 'border-gray-200/50 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 text-gray-700 dark:text-zinc-300'
                              }`}
                            >
                              Landscape (A4)
                            </button>
                          </div>
                        </div>

                        {/* Margin */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Page Margin</span>
                            <span>{pdfMargin} mm</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={pdfMargin}
                            onChange={(e) => setPdfMargin(Number(e.target.value))}
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* PDF compilation Trigger */}
                        <button
                          onClick={handleCompilePDF}
                          disabled={isCompilingPDF || files.filter((f) => f.status === 'completed').length === 0}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          {isCompilingPDF ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Compiling Book...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              <span>Merge Images into PDF</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Preview queue segment */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                          Document Pages ({files.length})
                        </span>
                        {files.filter((f) => f.status !== 'completed').length > 0 && (
                          <span className="text-[10px] font-bold text-amber-500">
                            *Some files are processing. Wait until ready to compile.
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {files.map((f, idx) => (
                          <div
                            key={f.id}
                            className="flex items-center space-x-4 frosted-card p-3.5 rounded-2xl"
                          >
                            <span className="w-6 h-6 rounded-full bg-gray-100/50 dark:bg-zinc-800/50 text-gray-500 font-black text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div className="w-12 h-12 rounded-lg bg-gray-50/50 dark:bg-zinc-950/50 overflow-hidden flex items-center justify-center shrink-0">
                              <img src={f.previewUrl} alt={f.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate">{f.name}</p>
                              <span className="text-[10px] text-gray-400 font-semibold">{f.width}×{f.height} px</span>
                            </div>
                            <div>
                              {f.status === 'completed' ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Batch Queue View */
                <BatchQueue
                  files={files}
                  onRemoveFile={handleRemoveFile}
                  onReplaceFile={handleReplaceFile}
                  onClearQueue={handleClearQueue}
                  onSelectFileToEdit={setSelectedFile}
                  onTriggerUpload={handleTriggerUploadClick}
                  onDownloadAllZIP={handleDownloadAllZIP}
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer setActiveTool={setActiveTool} />
    </div>
  );
}
