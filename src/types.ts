export type ToolType =
  | 'compress'
  | 'convert'
  | 'resize'
  | 'crop'
  | 'rotate'
  | 'watermark'
  | 'adjust'
  | 'pdf'
  | 'ai';

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  exposure: number;   // -100 to 100
  sharpness: number;  // 0 to 100
  blur: number;       // 0 to 100
  hue: number;        // -180 to 180
  temperature: number;// -100 to 100
  tint: number;       // -100 to 100
  gamma: number;      // 0.1 to 3.0, default 1.0
  vignette: number;   // 0 to 100
  grayscale: boolean;
  sepia: boolean;
  invert: boolean;
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  sharpness: 0,
  blur: 0,
  hue: 0,
  temperature: 0,
  tint: 0,
  gamma: 1.0,
  vignette: 0,
  grayscale: false,
  sepia: false,
  invert: false,
};

export interface WatermarkOptions {
  type: 'text' | 'image';
  text: string;
  fontFamily: string;
  color: string;
  fontSize: number;
  imageFile: File | null;
  imagePreview: string | null;
  opacity: number; // 0 to 1
  scale: number;   // 0.1 to 2
  rotation: number;// 0 to 360
  position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  padding: number; // px
}

export const DEFAULT_WATERMARK: WatermarkOptions = {
  type: 'text',
  text: 'PixelForge Watermark',
  fontFamily: 'sans-serif',
  color: '#ffffff',
  fontSize: 32,
  imageFile: null,
  imagePreview: null,
  opacity: 0.6,
  scale: 1,
  rotation: 0,
  position: 'center',
  padding: 20,
};

export interface AIAnalysis {
  caption: string;
  altText: string;
  tags: string[];
  compositionText: string;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    temperature: number;
    tint: number;
    sharpness: number;
  };
}

export interface PixelFile {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  processedSize: number | null;
  previewUrl: string;
  processedUrl: string | null;
  width: number;
  height: number;
  originalFormat: string; // e.g. 'png', 'jpg', 'webp'
  processedFormat: string | null;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  error: string | null;
  adjustments: ImageAdjustments;
  watermark: WatermarkOptions;
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  cropRect: { x: number; y: number; width: number; height: number } | null;
  aiAnalysis: AIAnalysis | null;
  aiLoading: boolean;
}

export interface ToolConfig {
  compress: {
    quality: number; // 1 to 100
    lossless: boolean;
  };
  convert: {
    format: 'jpg' | 'png' | 'webp' | 'gif' | 'bmp' | 'tiff' | 'ico' | 'pdf';
  };
  resize: {
    enabled: boolean;
    mode: 'pixels' | 'percentage' | 'social';
    width: number;
    height: number;
    percentage: number;
    aspectRatioLocked: boolean;
    socialPreset: string;
  };
}

export const DEFAULT_CONFIG: ToolConfig = {
  compress: {
    quality: 80,
    lossless: false,
  },
  convert: {
    format: 'png',
  },
  resize: {
    enabled: false,
    mode: 'pixels',
    width: 800,
    height: 600,
    percentage: 50,
    aspectRatioLocked: true,
    socialPreset: 'instagram-square',
  },
};
