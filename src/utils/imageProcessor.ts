import { PixelFile, ToolConfig } from '../types';

/**
 * Utility to load an image from a URL and return an HTMLImageElement
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = url;
  });
}

/**
 * Computes the correct target dimensions based on resize config
 */
export function calculateResizeDimensions(
  originalWidth: number,
  originalHeight: number,
  config: ToolConfig['resize']
): { width: number; height: number } {
  if (config.mode === 'percentage') {
    const scale = config.percentage / 100;
    return {
      width: Math.max(1, Math.round(originalWidth * scale)),
      height: Math.max(1, Math.round(originalHeight * scale)),
    };
  }

  if (config.mode === 'social') {
    // Standard social media presets
    switch (config.socialPreset) {
      case 'instagram-square':
        return { width: 1080, height: 1080 };
      case 'instagram-portrait':
        return { width: 1080, height: 1350 };
      case 'instagram-story':
        return { width: 1080, height: 1920 };
      case 'facebook-cover':
        return { width: 851, height: 315 };
      case 'youtube-thumbnail':
        return { width: 1280, height: 720 };
      case 'twitter-header':
        return { width: 1500, height: 500 };
      case 'linkedin-banner':
        return { width: 1584, height: 396 };
      default:
        return { width: 1080, height: 1080 };
    }
  }

  // Pixels mode
  if (config.aspectRatioLocked) {
    const originalRatio = originalWidth / originalHeight;
    if (config.width && !config.height) {
      return {
        width: config.width,
        height: Math.round(config.width / originalRatio),
      };
    } else if (config.height && !config.width) {
      return {
        width: Math.round(config.height * originalRatio),
        height: config.height,
      };
    } else {
      // Both specified - favor width and scale height to match aspect ratio
      return {
        width: config.width,
        height: Math.round(config.width / originalRatio),
      };
    }
  }

  return {
    width: config.width || originalWidth,
    height: config.height || originalHeight,
  };
}

/**
 * Process a single PixelFile and output the processed base64 or blob URL
 */
export async function processPixelFile(
  pixelFile: PixelFile,
  globalConfig: ToolConfig
): Promise<{ processedUrl: string; processedSize: number; format: string; width: number; height: number }> {
  // 1. Load the original image
  const img = await loadImage(pixelFile.previewUrl);

  // 2. Create target canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context for canvas processing');
  }

  // 3. Determine base dimensions (including cropping, flipping, rotation)
  let sourceX = 0;
  let sourceY = 0;
  let sourceW = img.naturalWidth;
  let sourceH = img.naturalHeight;

  if (pixelFile.cropRect) {
    sourceX = pixelFile.cropRect.x;
    sourceY = pixelFile.cropRect.y;
    sourceW = pixelFile.cropRect.width;
    sourceH = pixelFile.cropRect.height;
  }

  // Determine post-rotation orientation
  const is90or270 = pixelFile.rotation === 90 || pixelFile.rotation === 270;
  let drawW = sourceW;
  let drawH = sourceH;

  // Determine resizing
  let targetW = drawW;
  let targetH = drawH;
  
  if (globalConfig.resize && globalConfig.resize.enabled) {
    const targetDim = calculateResizeDimensions(drawW, drawH, globalConfig.resize);
    targetW = targetDim.width;
    targetH = targetDim.height;
  }

  // Canvas physical size depends on rotation
  const canvasW = is90or270 ? targetH : targetW;
  const canvasH = is90or270 ? targetW : targetH;

  canvas.width = canvasW;
  canvas.height = canvasH;

  // 4. Transform coordinate system for flips & rotations
  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);

  // Flip coordinates if requested
  const scaleX = pixelFile.flipH ? -1 : 1;
  const scaleY = pixelFile.flipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Rotate coordinates
  const rad = (pixelFile.rotation * Math.PI) / 180;
  ctx.rotate(rad);

  // Draw image to center
  // Adjust filter strings for canvas
  const adj = pixelFile.adjustments;
  const filters: string[] = [];

  if (adj.brightness !== 0) filters.push(`brightness(${100 + adj.brightness}%)`);
  if (adj.contrast !== 0) filters.push(`contrast(${100 + adj.contrast}%)`);
  if (adj.saturation !== 0) filters.push(`saturate(${100 + adj.saturation}%)`);
  if (adj.grayscale) filters.push('grayscale(100%)');
  if (adj.sepia) filters.push('sepia(100%)');
  if (adj.invert) filters.push('invert(100%)');
  if (adj.hue !== 0) filters.push(`hue-rotate(${adj.hue}deg)`);
  if (adj.blur !== 0) filters.push(`blur(${adj.blur / 10}px)`);
  if (adj.exposure !== 0) {
    // exposure maps to a combination of brightness & contrast boost
    const expFactor = 1 + (adj.exposure / 100);
    filters.push(`brightness(${expFactor * 100}%)`);
  }

  if (filters.length > 0) {
    ctx.filter = filters.join(' ');
  }

  // Draw scaled image segment
  // The source coordinates map to original, draw on rotated canvas center
  ctx.drawImage(
    img,
    sourceX, sourceY, sourceW, sourceH, // Source rect
    -targetW / 2, -targetH / 2, targetW, targetH // Target centered rect
  );

  // Restore transform state
  ctx.restore();

  // 5. Apply advanced adjustments that require canvas draws over the rendered image
  // Vignette overlay
  if (adj.vignette > 0) {
    const gradient = ctx.createRadialGradient(
      canvasW / 2, canvasH / 2, Math.min(canvasW, canvasH) * 0.2,
      canvasW / 2, canvasH / 2, Math.max(canvasW, canvasH) * 0.7
    );
    const alpha = (adj.vignette / 100) * 0.85;
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Temperature overlay (Amber/Warm vs Blue/Cool)
  if (adj.temperature !== 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'color'; // blending temperature color
    if (adj.temperature > 0) {
      // Warm Amber tint
      ctx.fillStyle = `rgba(245, 158, 11, ${Math.abs(adj.temperature) / 250})`;
    } else {
      // Cool Blue tint
      ctx.fillStyle = `rgba(37, 99, 235, ${Math.abs(adj.temperature) / 250})`;
    }
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  }

  // Tint overlay (Green vs Magenta)
  if (adj.tint !== 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    if (adj.tint > 0) {
      // Magenta/Pink
      ctx.fillStyle = `rgba(236, 72, 153, ${Math.abs(adj.tint) / 250})`;
    } else {
      // Green
      ctx.fillStyle = `rgba(34, 197, 94, ${Math.abs(adj.tint) / 250})`;
    }
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  }

  // Gamma / color balance curves (simplified contrast overlay)
  if (adj.gamma !== 1.0) {
    ctx.save();
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(0.5, (1.0 - adj.gamma) * 0.3))})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  }

  // 6. Watermark overlays
  const wm = pixelFile.watermark;
  if (wm.type === 'text' && wm.text.trim()) {
    ctx.save();
    const fontSize = wm.fontSize * (canvasW / 1000); // scaled relatively to canvas width
    ctx.font = `bold ${Math.max(12, fontSize)}px ${wm.fontFamily}`;
    ctx.fillStyle = wm.color;
    ctx.globalAlpha = wm.opacity;

    const metrics = ctx.measureText(wm.text);
    const textW = metrics.width;
    const textH = Math.max(12, fontSize);

    let x = wm.padding;
    let y = wm.padding + textH;

    // Layout alignment grid
    switch (wm.position) {
      case 'top-left':
        x = wm.padding;
        y = wm.padding + textH;
        break;
      case 'top-center':
        x = (canvasW - textW) / 2;
        y = wm.padding + textH;
        break;
      case 'top-right':
        x = canvasW - textW - wm.padding;
        y = wm.padding + textH;
        break;
      case 'center-left':
        x = wm.padding;
        y = (canvasH + textH) / 2;
        break;
      case 'center':
        x = (canvasW - textW) / 2;
        y = (canvasH + textH) / 2;
        break;
      case 'center-right':
        x = canvasW - textW - wm.padding;
        y = (canvasH + textH) / 2;
        break;
      case 'bottom-left':
        x = wm.padding;
        y = canvasH - wm.padding;
        break;
      case 'bottom-center':
        x = (canvasW - textW) / 2;
        y = canvasH - wm.padding;
        break;
      case 'bottom-right':
        x = canvasW - textW - wm.padding;
        y = canvasH - wm.padding;
        break;
    }

    // Apply rotation if any
    if (wm.rotation !== 0) {
      ctx.translate(x + textW/2, y - textH/2);
      ctx.rotate((wm.rotation * Math.PI) / 180);
      ctx.fillText(wm.text, -textW/2, textH/2);
    } else {
      ctx.fillText(wm.text, x, y);
    }
    ctx.restore();
  } else if (wm.type === 'image' && wm.imagePreview) {
    try {
      const wmImg = await loadImage(wm.imagePreview);
      ctx.save();
      ctx.globalAlpha = wm.opacity;

      // Scale watermark relatively to canvas
      const targetWmWidth = (canvasW * 0.2) * wm.scale;
      const targetWmHeight = (targetWmWidth / wmImg.width) * wmImg.height;

      let x = wm.padding;
      let y = wm.padding;

      switch (wm.position) {
        case 'top-left':
          x = wm.padding;
          y = wm.padding;
          break;
        case 'top-center':
          x = (canvasW - targetWmWidth) / 2;
          y = wm.padding;
          break;
        case 'top-right':
          x = canvasW - targetWmWidth - wm.padding;
          y = wm.padding;
          break;
        case 'center-left':
          x = wm.padding;
          y = (canvasH - targetWmHeight) / 2;
          break;
        case 'center':
          x = (canvasW - targetWmWidth) / 2;
          y = (canvasH - targetWmHeight) / 2;
          break;
        case 'center-right':
          x = canvasW - targetWmWidth - wm.padding;
          y = (canvasH - targetWmHeight) / 2;
          break;
        case 'bottom-left':
          x = wm.padding;
          y = canvasH - targetWmHeight - wm.padding;
          break;
        case 'bottom-center':
          x = (canvasW - targetWmWidth) / 2;
          y = canvasH - targetWmHeight - wm.padding;
          break;
        case 'bottom-right':
          x = canvasW - targetWmWidth - wm.padding;
          y = canvasH - targetWmHeight - wm.padding;
          break;
      }

      if (wm.rotation !== 0) {
        ctx.translate(x + targetWmWidth/2, y + targetWmHeight/2);
        ctx.rotate((wm.rotation * Math.PI) / 180);
        ctx.drawImage(wmImg, -targetWmWidth/2, -targetWmHeight/2, targetWmWidth, targetWmHeight);
      } else {
        ctx.drawImage(wmImg, x, y, targetWmWidth, targetWmHeight);
      }
      ctx.restore();
    } catch (e) {
      console.error('Failed drawing watermark image:', e);
    }
  }

  // 7. Extract processed Blob/DataURL based on output format and quality compression parameters
  let outputFormat = globalConfig.convert?.format || 'png';
  let mimeType = `image/${outputFormat}`;
  if (outputFormat === 'jpg') {
    mimeType = 'image/jpeg';
  }

  // Limit compression quality parameters
  const quality = (globalConfig.compress?.quality || 80) / 100;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas compilation produced empty blob.'));
          return;
        }

        const processedUrl = URL.createObjectURL(blob);
        resolve({
          processedUrl,
          processedSize: blob.size,
          format: outputFormat,
          width: canvasW,
          height: canvasH,
        });
      },
      mimeType,
      outputFormat === 'png' && globalConfig.compress?.lossless ? undefined : quality
    );
  });
}
