import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Check, Sparkles, Undo, Redo, RefreshCw, Layers, Crop, RotateCw, Type as TypeIcon, Image as ImageIcon, Sliders, FileText, ArrowLeft, ArrowRight, Copy, CheckSquare, ZoomIn, ZoomOut, AlertCircle, Plus
} from 'lucide-react';
import { PixelFile, ToolType, ToolConfig, ImageAdjustments, DEFAULT_ADJUSTMENTS, WatermarkOptions, DEFAULT_WATERMARK } from '../types';
import { processPixelFile } from '../utils/imageProcessor';

interface ImageEditorPanelProps {
  file: PixelFile;
  globalConfig: ToolConfig;
  setGlobalConfig: (config: ToolConfig) => void;
  onUpdateFile: (updated: PixelFile) => void;
  onClose: () => void;
}

export default function ImageEditorPanel({
  file,
  globalConfig,
  setGlobalConfig,
  onUpdateFile,
  onClose,
}: ImageEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<ToolType>('compress');
  const [compareSplit, setCompareSplit] = useState(50); // percentage for the slider split
  const [isComparing, setIsComparing] = useState(true);
  const [historyStack, setHistoryStack] = useState<ImageAdjustments[]>([file.adjustments]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(file.processedUrl || file.previewUrl);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedAlt, setCopiedAlt] = useState(false);

  // Cropper sliders state in percentage (0 to 100)
  const [cropLeft, setCropLeft] = useState(0);
  const [cropTop, setCropTop] = useState(0);
  const [cropWidth, setCropWidth] = useState(100);
  const [cropHeight, setCropHeight] = useState(100);

  // Resize local controls
  const [resizeWidth, setResizeWidth] = useState(globalConfig.resize.width);
  const [resizeHeight, setResizeHeight] = useState(globalConfig.resize.height);

  const containerRef = useRef<HTMLDivElement>(null);

  // Track history updates to adjustments
  const updateAdjustments = (newAdj: Partial<ImageAdjustments>) => {
    const nextAdj = { ...file.adjustments, ...newAdj };
    
    // Add to history
    const trimmedStack = historyStack.slice(0, historyIndex + 1);
    const nextStack = [...trimmedStack, nextAdj];
    setHistoryStack(nextStack);
    setHistoryIndex(nextStack.length - 1);

    onUpdateFile({
      ...file,
      adjustments: nextAdj,
      status: 'idle', // Re-evaluate processed results
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      onUpdateFile({
        ...file,
        adjustments: historyStack[prevIndex],
        status: 'idle',
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      onUpdateFile({
        ...file,
        adjustments: historyStack[nextIndex],
        status: 'idle',
      });
    }
  };

  const handleResetFilters = () => {
    updateAdjustments(DEFAULT_ADJUSTMENTS);
  };

  // Disable live comparison on Crop/Resize tabs where alignment is altered
  useEffect(() => {
    if (activeTab === 'crop' || activeTab === 'resize') {
      setIsComparing(false);
    }
  }, [activeTab]);

  // Re-run processor to update local preview on adjustments / rotation / cropping / watermarking changes
  useEffect(() => {
    const reprocess = async () => {
      setIsProcessing(true);
      try {
        const result = await processPixelFile(file, globalConfig);
        setLocalPreviewUrl(result.processedUrl);
        onUpdateFile({
          ...file,
          processedUrl: result.processedUrl,
          processedSize: result.processedSize,
          processedFormat: result.format,
          status: 'completed',
        });
      } catch (err) {
        console.error('Local reprocess failure:', err);
      } finally {
        setIsProcessing(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      reprocess();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [
    file.id,
    file.adjustments.brightness,
    file.adjustments.contrast,
    file.adjustments.saturation,
    file.adjustments.exposure,
    file.adjustments.sharpness,
    file.adjustments.blur,
    file.adjustments.hue,
    file.adjustments.temperature,
    file.adjustments.tint,
    file.adjustments.gamma,
    file.adjustments.vignette,
    file.adjustments.grayscale,
    file.adjustments.sepia,
    file.adjustments.invert,
    file.watermark.type,
    file.watermark.text,
    file.watermark.fontFamily,
    file.watermark.color,
    file.watermark.fontSize,
    file.watermark.opacity,
    file.watermark.scale,
    file.watermark.rotation,
    file.watermark.position,
    file.watermark.padding,
    file.watermark.imagePreview,
    file.rotation,
    file.flipH,
    file.flipV,
    file.cropRect?.x,
    file.cropRect?.y,
    file.cropRect?.width,
    file.cropRect?.height,
    globalConfig.convert.format,
    globalConfig.compress.quality,
    globalConfig.compress.lossless,
    globalConfig.resize.enabled,
    globalConfig.resize.mode,
    globalConfig.resize.width,
    globalConfig.resize.height,
    globalConfig.resize.percentage,
    globalConfig.resize.aspectRatioLocked,
    globalConfig.resize.socialPreset,
  ]);

  // Sync cropping sliders if file already has a crop rectangle
  useEffect(() => {
    if (file.cropRect) {
      setCropLeft(Math.round((file.cropRect.x / file.width) * 100));
      setCropTop(Math.round((file.cropRect.y / file.height) * 100));
      setCropWidth(Math.round((file.cropRect.width / file.width) * 100));
      setCropHeight(Math.round((file.cropRect.height / file.height) * 100));
    }
  }, []);

  const handleResetEntireImage = () => {
    onUpdateFile({
      ...file,
      adjustments: DEFAULT_ADJUSTMENTS,
      watermark: DEFAULT_WATERMARK,
      rotation: 0,
      flipH: false,
      flipV: false,
      cropRect: null,
      status: 'idle',
    });
    setCropLeft(0);
    setCropTop(0);
    setCropWidth(100);
    setCropHeight(100);
    setHistoryStack([DEFAULT_ADJUSTMENTS]);
    setHistoryIndex(0);
    setLocalPreviewUrl(file.previewUrl);
  };

  const handleReplaceImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFileObj = e.target.files?.[0];
    if (selectedFileObj) {
      const previewUrl = URL.createObjectURL(selectedFileObj);
      const img = new Image();
      img.onload = () => {
        onUpdateFile({
          ...file,
          file: selectedFileObj,
          name: selectedFileObj.name,
          originalSize: selectedFileObj.size,
          processedSize: null,
          previewUrl: previewUrl,
          processedUrl: null,
          width: img.naturalWidth,
          height: img.naturalHeight,
          status: 'idle',
          progress: 0,
          error: null,
          adjustments: DEFAULT_ADJUSTMENTS,
          watermark: DEFAULT_WATERMARK,
          rotation: 0,
          flipH: false,
          flipV: false,
          cropRect: null,
          aiAnalysis: null,
          aiLoading: false,
        });
        setLocalPreviewUrl(previewUrl);
        setCropLeft(0);
        setCropTop(0);
        setCropWidth(100);
        setCropHeight(100);
        setHistoryStack([DEFAULT_ADJUSTMENTS]);
        setHistoryIndex(0);
      };
      img.src = previewUrl;
    }
  };

  const handleCropChange = (left: number, top: number, width: number, height: number) => {
    // Boundary checks
    const checkedLeft = Math.max(0, Math.min(100, left));
    const checkedTop = Math.max(0, Math.min(100, top));
    const checkedWidth = Math.max(1, Math.min(100 - checkedLeft, width));
    const checkedHeight = Math.max(1, Math.min(100 - checkedTop, height));

    setCropLeft(checkedLeft);
    setCropTop(checkedTop);
    setCropWidth(checkedWidth);
    setCropHeight(checkedHeight);

    // Convert percentage back to physical pixels
    const pxX = Math.round((checkedLeft / 100) * file.width);
    const pxY = Math.round((checkedTop / 100) * file.height);
    const pxW = Math.round((checkedWidth / 100) * file.width);
    const pxH = Math.round((checkedHeight / 100) * file.height);

    onUpdateFile({
      ...file,
      cropRect: { x: pxX, y: pxY, width: pxW, height: pxH },
      status: 'idle',
    });
  };

  const handleResetCrop = () => {
    setCropLeft(0);
    setCropTop(0);
    setCropWidth(100);
    setCropHeight(100);
    onUpdateFile({
      ...file,
      cropRect: null,
      status: 'idle',
    });
  };

  // Preset cropping ratios
  const handleCropPreset = (ratio: string) => {
    if (ratio === 'free') {
      handleResetCrop();
      return;
    }

    const [rw, rh] = ratio.split(':').map(Number);
    const targetRatio = rw / rh;
    const currentRatio = file.width / file.height;

    let nextW = 100;
    let nextH = 100;

    if (currentRatio > targetRatio) {
      // Image is wider than crop aspect ratio - height will be 100%, width will shrink
      nextW = Math.round((targetRatio / currentRatio) * 100);
    } else {
      // Image is taller than crop aspect ratio - width will be 100%, height will shrink
      nextH = Math.round((currentRatio / targetRatio) * 100);
    }

    const nextL = Math.round((100 - nextW) / 2);
    const nextT = Math.round((100 - nextH) / 2);

    handleCropChange(nextL, nextT, nextW, nextH);
  };

  // Watermark customization triggers
  const handleWatermarkChange = (options: Partial<WatermarkOptions>) => {
    onUpdateFile({
      ...file,
      watermark: { ...file.watermark, ...options },
      status: 'idle',
    });
  };

  const handleWatermarkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imageFile = e.target.files?.[0];
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        handleWatermarkChange({
          imageFile,
          imagePreview: reader.result as string,
        });
      };
      reader.readAsDataURL(imageFile);
    }
  };

  // Convert image helper for AI upload
  const getBase64 = (fileObj: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileObj);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Call Server-side AI assistant
  const handleCallAIAssistant = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const base64Image = await getBase64(file.file);
      const mimeType = file.file.type;

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Image, mimeType }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      onUpdateFile({
        ...file,
        aiAnalysis: data,
      });
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'AI analysis failed. Please verify your internet connection or try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAISuggestions = () => {
    if (file.aiAnalysis) {
      const suggestions = file.aiAnalysis.adjustments;
      updateAdjustments({
        brightness: suggestions.brightness,
        contrast: suggestions.contrast,
        saturation: suggestions.saturation,
        temperature: suggestions.temperature,
        tint: suggestions.tint,
        sharpness: suggestions.sharpness,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAlt(true);
    setTimeout(() => setCopiedAlt(false), 2000);
  };

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="editor-workspace">
      {/* Visual Workstation Area (Col-span 7) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-gray-600 dark:text-zinc-400 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Queue</span>
            </button>

            {/* Replace Image Button */}
            <label className="px-3.5 py-2 rounded-xl bg-blue-50/50 hover:bg-blue-100/60 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 border border-blue-200/30 dark:border-blue-900/30 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1.5 transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>Replace Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleReplaceImageFile}
                className="hidden"
              />
            </label>

            {/* Reset All Button */}
            <button
              onClick={handleResetEntireImage}
              className="px-3.5 py-2 rounded-xl bg-red-50/50 hover:bg-red-100/60 dark:bg-red-950/30 dark:hover:bg-red-900/40 border border-red-200/30 dark:border-red-900/30 text-xs font-bold text-red-600 dark:text-red-400 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Reset all filters, crop, and transformations"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-500">Live Compare</span>
            <button
              onClick={() => setIsComparing(!isComparing)}
              className={`p-1 px-3.5 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                isComparing
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'
              }`}
            >
              {isComparing ? 'Active' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Visual Comparison Stage */}
        <div 
          ref={containerRef}
          className="relative aspect-video rounded-3xl bg-gray-50/40 dark:bg-zinc-950/40 border border-gray-200/20 dark:border-zinc-800/35 overflow-hidden shadow-inner flex items-center justify-center group/preview backdrop-blur-md"
        >
          {isComparing ? (
            <div className="relative w-full h-full select-none">
              {/* Processed (After) Image - Full canvas */}
              <img
                src={localPreviewUrl || file.previewUrl}
                alt="Processed"
                className="w-full h-full object-contain absolute inset-0 pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* Original (Before) Image - Clipped width */}
              <div
                style={{ clipPath: `polygon(0 0, ${compareSplit}% 0, ${compareSplit}% 100%, 0 100%)` }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <img
                  src={file.previewUrl}
                  alt="Original"
                  className="w-full h-full object-contain absolute inset-0 bg-gray-100 dark:bg-zinc-950"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Slider Controller */}
              <div
                style={{ left: `${compareSplit}%` }}
                className="absolute top-0 bottom-0 w-1 bg-white shadow-xl cursor-ew-resize z-10 flex items-center justify-center transform -translate-x-1/2"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-600 dark:text-zinc-300 shadow-xl font-bold text-xs select-none pointer-events-none">
                  ↔
                </div>
              </div>

              {/* Drag input element overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={compareSplit}
                onChange={(e) => setCompareSplit(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />

              <div className="absolute top-4 left-4 px-2 py-1 rounded bg-black/70 text-white text-[10px] font-bold pointer-events-none uppercase">
                Original (Left)
              </div>
              <div className="absolute top-4 right-4 px-2 py-1 rounded bg-blue-600/90 text-white text-[10px] font-bold pointer-events-none uppercase">
                Processed (Right)
              </div>
            </div>
          ) : (
            <img
              src={localPreviewUrl || file.previewUrl}
              alt="Processed View"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center space-x-2 text-white">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
              <span className="text-xs font-bold tracking-wider uppercase">Processing Live Canvas...</span>
            </div>
          )}
        </div>

        {/* Global Transformer Buttons below stage */}
        <div className="flex flex-wrap justify-center gap-3 py-3 bg-white/20 dark:bg-zinc-950/15 backdrop-blur-sm border border-slate-200/40 dark:border-zinc-800/40 rounded-2xl px-4">
          <button
            onClick={() => onUpdateFile({ ...file, rotation: (file.rotation + 270) % 360, status: 'idle' })}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200/50 dark:border-zinc-700/50 hover:bg-gray-50 dark:hover:bg-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4 scale-x-[-1]" />
            <span>Rotate Left</span>
          </button>
          <button
            onClick={() => onUpdateFile({ ...file, rotation: (file.rotation + 90) % 360, status: 'idle' })}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200/50 dark:border-zinc-700/50 hover:bg-gray-50 dark:hover:bg-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Rotate Right</span>
          </button>
          <button
            onClick={() => onUpdateFile({ ...file, flipH: !file.flipH, status: 'idle' })}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200/50 dark:border-zinc-700/50 hover:bg-gray-50 dark:hover:bg-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>Flip Horizontal</span>
          </button>
          <button
            onClick={() => onUpdateFile({ ...file, flipV: !file.flipV, status: 'idle' })}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200/50 dark:border-zinc-700/50 hover:bg-gray-50 dark:hover:bg-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>Flip Vertical</span>
          </button>
        </div>
      </div>

      {/* Editor Configuration Sidebar (Col-span 5) */}
      <div className="lg:col-span-5 frosted-card rounded-3xl overflow-hidden flex flex-col">
        {/* Tab Headers */}
        <div className="grid grid-cols-4 gap-0.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/30 p-1">
          {[
            { type: 'compress', label: 'Optimize', icon: <Sliders className="w-3.5 h-3.5" /> },
            { type: 'convert', label: 'Convert', icon: <Layers className="w-3.5 h-3.5" /> },
            { type: 'resize', label: 'Resize', icon: <Sliders className="w-3.5 h-3.5" /> },
            { type: 'crop', label: 'Crop', icon: <Crop className="w-3.5 h-3.5" /> },
            { type: 'watermark', label: 'Mark', icon: <TypeIcon className="w-3.5 h-3.5" /> },
            { type: 'adjust', label: 'Filters', icon: <Sliders className="w-3.5 h-3.5" /> },
            { type: 'ai', label: '✨ AI Smart', icon: <Sparkles className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type as ToolType)}
              className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === tab.type
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs border border-gray-200/50 dark:border-zinc-700/50'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Panel Content */}
        <div className="p-6 space-y-6 flex-1 max-h-[640px] overflow-y-auto">
          {/* COMPRESS TAB */}
          {activeTab === 'compress' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Optimization Settings</h3>
                <p className="text-xs font-semibold text-gray-400">Reduce filesize while keeping high resolution</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600 dark:text-zinc-400">Compression Quality</span>
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{globalConfig.compress.quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={globalConfig.compress.quality}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig,
                        compress: { ...globalConfig.compress, quality: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                    <span>Max Compression</span>
                    <span>Best Quality</span>
                  </div>
                </div>

                <label className="flex items-center space-x-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalConfig.compress.lossless}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig,
                        compress: { ...globalConfig.compress, lossless: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 block">Lossless PNG Compression</span>
                    <span className="text-[10px] text-gray-400 font-semibold block">Keep perfect pixel quality without compression artifacts</span>
                  </div>
                </label>

                {/* Compression Estimates */}
                <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/30 dark:border-blue-900/30 space-y-2 text-xs">
                  <p className="font-extrabold text-blue-800 dark:text-blue-400">Saved Estimates</p>
                  <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-zinc-400 font-medium">
                    <span>Original Size:</span>
                    <span className="text-right font-bold text-gray-900 dark:text-white">{formatSize(file.originalSize)}</span>
                    <span>Estimated Optimized:</span>
                    <span className="text-right font-bold text-emerald-500">
                      {file.processedSize ? formatSize(file.processedSize) : 'calculating...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONVERT TAB */}
          {activeTab === 'convert' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Format Converter</h3>
                <p className="text-xs font-semibold text-gray-400">Convert this image into popular web formats</p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {(['png', 'jpg', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'pdf'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() =>
                      setGlobalConfig({
                        ...globalConfig,
                        convert: { format: fmt },
                      })
                    }
                    className={`p-3.5 rounded-2xl text-xs font-extrabold uppercase border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      globalConfig.convert.format === fmt
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs">{fmt}</span>
                    <span className="text-[9px] font-medium text-gray-400 block lowercase">
                      {fmt === 'jpg' ? 'jpeg' : fmt === 'pdf' ? 'document' : 'image'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RESIZE TAB */}
          {activeTab === 'resize' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Dimension Settings</h3>
                <p className="text-xs font-semibold text-gray-400">Resize width/height or use preset templates</p>
              </div>

              <label className="flex items-center space-x-3 p-3.5 rounded-2xl bg-gray-50/50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalConfig.resize.enabled}
                  onChange={(e) =>
                    setGlobalConfig({
                      ...globalConfig,
                      resize: { ...globalConfig.resize, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 block">Enable Resizing</span>
                  <span className="text-[10px] text-gray-400 font-semibold block">Scale this image to target dimensions</span>
                </div>
              </label>

              {globalConfig.resize.enabled && (
                <div className="space-y-6">
                  {/* Mode Selection */}
                  <div className="grid grid-cols-3 gap-1 bg-gray-50 dark:bg-zinc-950/40 p-1 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    {(['pixels', 'percentage', 'social'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          setGlobalConfig({
                            ...globalConfig,
                            resize: { ...globalConfig.resize, mode },
                          })
                        }
                        className={`py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          globalConfig.resize.mode === mode
                            ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-gray-500 dark:text-zinc-400'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {/* Mode Options */}
                  {globalConfig.resize.mode === 'pixels' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Width (px)</label>
                      <input
                        type="number"
                        value={resizeWidth}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setResizeWidth(val);
                          setGlobalConfig({
                            ...globalConfig,
                            resize: { ...globalConfig.resize, width: val },
                          });
                        }}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Height (px)</label>
                      <input
                        type="number"
                        value={resizeHeight}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setResizeHeight(val);
                          setGlobalConfig({
                            ...globalConfig,
                            resize: { ...globalConfig.resize, height: val },
                          });
                        }}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalConfig.resize.aspectRatioLocked}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          resize: { ...globalConfig.resize, aspectRatioLocked: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">Maintain Original Aspect Ratio</span>
                  </label>
                </div>
              )}

              {globalConfig.resize.mode === 'percentage' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600 dark:text-zinc-400">Scale Output Size</span>
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{globalConfig.resize.percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={globalConfig.resize.percentage}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig,
                        resize: { ...globalConfig.resize, percentage: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                    <span>1%</span>
                    <span>100% (Full Size)</span>
                  </div>
                </div>
              )}

              {globalConfig.resize.mode === 'social' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Social Presets</label>
                    <select
                      value={globalConfig.resize.socialPreset}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          resize: { ...globalConfig.resize, socialPreset: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 focus:outline-none"
                    >
                      <option value="instagram-square">Instagram Square (1:1)</option>
                      <option value="instagram-portrait">Instagram Portrait (4:5)</option>
                      <option value="instagram-story">Instagram Story (9:16)</option>
                      <option value="facebook-cover">Facebook Cover (851×315)</option>
                      <option value="youtube-thumbnail">YouTube Thumbnail (16:9)</option>
                      <option value="twitter-header">X / Twitter Header (3:1)</option>
                      <option value="linkedin-banner">LinkedIn Banner (4:1)</option>
                    </select>
                  </div>
                </div>
              )}
                </div>
              )}
            </div>
          )}

          {/* CROP TAB */}
          {activeTab === 'crop' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Crop / Aspect Ratios</h3>
                <p className="text-xs font-semibold text-gray-400">Set precise crop dimensions or presets</p>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'free', label: 'Free Crop' },
                  { id: '1:1', label: '1:1 Square' },
                  { id: '4:5', label: '4:5 Portrait' },
                  { id: '16:9', label: '16:9 Cinema' },
                  { id: '9:16', label: '9:16 Story' },
                  { id: '3:2', label: '3:2 Camera' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleCropPreset(p.id)}
                    className="p-3 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-bold text-center border border-gray-100 dark:border-zinc-700 cursor-pointer transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Sliders manual cropping details */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Crop Region Fine-tuning</span>
                  <button onClick={handleResetCrop} className="text-[10px] font-bold text-red-500 hover:underline">
                    Reset Crop
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Crop Left Offset</span>
                    <span className="font-extrabold">{cropLeft}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={cropLeft}
                    onChange={(e) => handleCropChange(Number(e.target.value), cropTop, cropWidth, cropHeight)}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Crop Top Offset</span>
                    <span className="font-extrabold">{cropTop}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={cropTop}
                    onChange={(e) => handleCropChange(cropLeft, Number(e.target.value), cropWidth, cropHeight)}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Crop Width Span</span>
                    <span className="font-extrabold">{cropWidth}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max={100 - cropLeft}
                    value={cropWidth}
                    onChange={(e) => handleCropChange(cropLeft, cropTop, Number(e.target.value), cropHeight)}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Crop Height Span</span>
                    <span className="font-extrabold">{cropHeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max={100 - cropTop}
                    value={cropHeight}
                    onChange={(e) => handleCropChange(cropLeft, cropTop, cropWidth, Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* WATERMARK TAB */}
          {activeTab === 'watermark' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Watermark Overlay</h3>
                <p className="text-xs font-semibold text-gray-400">Add secure text or logo watermarks directly</p>
              </div>

              {/* Watermark type selector */}
              <div className="grid grid-cols-2 gap-1 bg-gray-50 dark:bg-zinc-950/40 p-1 rounded-2xl border border-gray-100 dark:border-zinc-800">
                <button
                  onClick={() => handleWatermarkChange({ type: 'text' })}
                  className={`py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    file.watermark.type === 'text' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400' : 'text-gray-500'
                  }`}
                >
                  Text Watermark
                </button>
                <button
                  onClick={() => handleWatermarkChange({ type: 'image' })}
                  className={`py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    file.watermark.type === 'image' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400' : 'text-gray-500'
                  }`}
                >
                  Image Logo
                </button>
              </div>

              {/* Text Option */}
              {file.watermark.type === 'text' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Text Content</label>
                    <input
                      type="text"
                      value={file.watermark.text}
                      onChange={(e) => handleWatermarkChange({ text: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Font Size (Scaled)</label>
                      <input
                        type="number"
                        value={file.watermark.fontSize}
                        onChange={(e) => handleWatermarkChange({ fontSize: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Font Color</label>
                      <input
                        type="color"
                        value={file.watermark.color}
                        onChange={(e) => handleWatermarkChange({ color: e.target.value })}
                        className="w-full h-8 p-0 rounded-xl border border-gray-200 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Option */}
              {file.watermark.type === 'image' && (
                <div className="space-y-3">
                  <label className="block p-4 border border-dashed border-gray-200 dark:border-zinc-800 hover:border-blue-500 rounded-2xl cursor-pointer text-center bg-gray-50 dark:bg-zinc-950/40">
                    <input type="file" accept="image/*" onChange={handleWatermarkImageUpload} className="hidden" />
                    {file.watermark.imagePreview ? (
                      <div className="flex items-center justify-center space-x-2 text-xs font-bold text-gray-700">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Logo Uploaded successfully</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-gray-500">Upload watermark logo image</span>
                    )}
                  </label>
                </div>
              )}

              {/* Positioning Grid - 3x3 */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Grid Position</label>
                <div className="grid grid-cols-3 gap-1.5 w-32 mx-auto">
                  {(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'] as WatermarkOptions['position'][]).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => handleWatermarkChange({ position: pos })}
                      className={`h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        file.watermark.position === pos
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600'
                          : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                      }`}
                      title={pos}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity slider */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600 dark:text-zinc-400">Opacity</span>
                    <span>{Math.round(file.watermark.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={file.watermark.opacity}
                    onChange={(e) => handleWatermarkChange({ opacity: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600 dark:text-zinc-400">Padding</span>
                    <span>{file.watermark.padding}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={file.watermark.padding}
                    onChange={(e) => handleWatermarkChange({ padding: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600 dark:text-zinc-400">Rotation Angle</span>
                    <span>{file.watermark.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={file.watermark.rotation}
                    onChange={(e) => handleWatermarkChange({ rotation: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ADJUST TAB */}
          {activeTab === 'adjust' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">Filters &amp; Sliders</h3>
                  <p className="text-xs font-semibold text-gray-400">Precise light and color calibration</p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Sliders Stack */}
              <div className="space-y-4">
                {[
                  { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
                  { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
                  { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
                  { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
                  { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
                  { key: 'blur', label: 'Blur', min: 0, max: 100 },
                  { key: 'hue', label: 'Hue Rotation', min: -180, max: 180 },
                  { key: 'temperature', label: 'Temperature (Warm/Cool)', min: -100, max: 100 },
                  { key: 'tint', label: 'Tint (Magenta/Green)', min: -100, max: 100 },
                  { key: 'gamma', label: 'Gamma Curve', min: 0.1, max: 3.0, step: 0.1 },
                  { key: 'vignette', label: 'Vignette Depth', min: 0, max: 100 },
                ].map((slider) => {
                  const val = (file.adjustments as any)[slider.key];
                  return (
                    <div key={slider.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-zinc-400">
                        <span>{slider.label}</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {slider.key === 'gamma' ? val.toFixed(1) : `${val > 0 ? '+' : ''}${val}`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step || 1}
                        value={val}
                        onChange={(e) => updateAdjustments({ [slider.key]: Number(e.target.value) })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Style Presets Toggles */}
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Style Presets</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateAdjustments({ grayscale: !file.adjustments.grayscale })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      file.adjustments.grayscale
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'
                    }`}
                  >
                    Grayscale
                  </button>
                  <button
                    onClick={() => updateAdjustments({ sepia: !file.adjustments.sepia })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      file.adjustments.sepia
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'
                    }`}
                  >
                    Sepia
                  </button>
                  <button
                    onClick={() => updateAdjustments({ invert: !file.adjustments.invert })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      file.adjustments.invert
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'
                    }`}
                  >
                    Invert
                  </button>
                </div>
              </div>

              {/* History stack undo/redo */}
              <div className="flex justify-center space-x-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-2 border border-gray-200 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 transition-colors flex items-center space-x-1.5 cursor-pointer text-xs font-bold"
                >
                  <Undo className="w-4 h-4" />
                  <span>Undo</span>
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= historyStack.length - 1}
                  className="p-2 border border-gray-200 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 transition-colors flex items-center space-x-1.5 cursor-pointer text-xs font-bold"
                >
                  <Redo className="w-4 h-4" />
                  <span>Redo</span>
                </button>
              </div>
            </div>
          )}

          {/* AI ASSISTANT TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-6" id="ai-assistant-container">
              <div className="space-y-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span>AI Smart Assistant</span>
                </h3>
                <p className="text-xs font-semibold text-gray-400">Let Gemini analyze composition, write alt-text, and recommend enhancing settings</p>
              </div>

              {!file.aiAnalysis && !aiLoading && (
                <div className="text-center py-8 space-y-4">
                  <div className="p-4 bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-950 border border-blue-100/40 dark:border-zinc-800 rounded-3xl max-w-sm mx-auto">
                    <p className="text-xs text-gray-600 dark:text-zinc-400 font-medium leading-relaxed">
                      Send your photo to the server-side Gemini 3.5 Flash model. The AI will inspect focus, lighting, and objects to suggest perfect color corrections.
                    </p>
                  </div>
                  <button
                    onClick={handleCallAIAssistant}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/10 flex items-center justify-center space-x-1.5 mx-auto transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Image Composition</span>
                  </button>
                </div>
              )}

              {/* Pulsing Loading Skeletons */}
              {aiLoading && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded-lg w-2/3" />
                  <div className="h-32 bg-gray-100 dark:bg-zinc-800 rounded-2xl w-full" />
                  <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded-lg w-1/2" />
                  <div className="h-24 bg-gray-100 dark:bg-zinc-800 rounded-2xl w-full" />
                  <p className="text-[10px] font-bold text-center text-indigo-500 dark:text-indigo-400 uppercase tracking-widest animate-bounce">
                    Gemini is thinking and reviewing lighting...
                  </p>
                </div>
              )}

              {aiError && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 flex items-start space-x-2.5 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="font-semibold">{aiError}</span>
                </div>
              )}

              {/* Resolved Report */}
              {file.aiAnalysis && (
                <div className="space-y-5 text-xs">
                  {/* Smart auto enhance prompt */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/50 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-black text-indigo-900 dark:text-indigo-400 block">Autocorrect available</span>
                      <span className="text-[10px] font-semibold text-gray-500 block">Inject recommended sliders</span>
                    </div>
                    <button
                      onClick={handleApplyAISuggestions}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase shadow-md transition-colors cursor-pointer"
                    >
                      Apply Enhancements
                    </button>
                  </div>

                  {/* Caption */}
                  <div className="space-y-1 bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Image Description</span>
                    <p className="text-gray-800 dark:text-zinc-200 font-medium leading-relaxed">{file.aiAnalysis.caption}</p>
                  </div>

                  {/* Alt text copyable */}
                  <div className="space-y-1 bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Accessibility Alt-Text</span>
                      <button
                        onClick={() => copyToClipboard(file.aiAnalysis!.altText)}
                        className="text-gray-500 hover:text-blue-500 flex items-center space-x-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedAlt ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-gray-800 dark:text-zinc-200 font-medium leading-relaxed italic">{file.aiAnalysis.altText}</p>
                  </div>

                  {/* Visual Composition remarks */}
                  <div className="space-y-1 bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Visual Composition</span>
                    <p className="text-gray-800 dark:text-zinc-200 font-medium leading-relaxed">{file.aiAnalysis.compositionText}</p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Suggested Metadata Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {file.aiAnalysis.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-[10px] font-bold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
