import { useCallback, useRef } from 'react';
import { BrightnessData, ContourSettings } from '../types/ImageTypes';
import { DisplayOptions } from '../types/UITypes';
import { FrequencyData } from '../types/FrequencyTypes';

// レイヤー描画に使う補助入力（処理結果画像と各種ブレンド率）
export interface RenderLayerInputs {
  filteredImageData?: ImageData | null;
  imageFilterOpacity?: number; // 0-100
  denoisedImageData?: ImageData | null;
  denoiseOpacity?: number; // 0-100
  frequencyData?: FrequencyData | null;
}

interface UseCanvasRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  renderWithLayers: (
    originalImageData: ImageData,
    brightnessData: BrightnessData | null,
    displayOptions: DisplayOptions,
    contourSettings: ContourSettings,
    inputs?: RenderLayerInputs
  ) => void;
  clearCanvas: () => void;
}

// Linear Light合成用に事前分解した明部・暗部成分
interface LinearLightParts {
  bright: HTMLCanvasElement;
  dark: HTMLCanvasElement;
}

interface ContourCacheEntry {
  source: object; // BrightnessData または ImageData（参照比較のみ）
  settingsKey: string;
  canvas: HTMLCanvasElement;
}

// レンダリング中間結果のキャッシュ。
// 重い処理（等高線検出・グレースケール変換・Linear Light分解）は入力が
// 変わったときだけ再計算し、レイヤー切替や透明度変更では drawImage 合成のみ行う。
interface RenderCache {
  source: WeakMap<ImageData, HTMLCanvasElement>;
  grayscale: WeakMap<ImageData, HTMLCanvasElement>;
  contour: ContourCacheEntry | null;
  filteredContour: ContourCacheEntry | null;
  denoisedContour: ContourCacheEntry | null;
  linearLightParts: WeakMap<ImageData, LinearLightParts>;
  grayscaleLinearLightParts: WeakMap<ImageData, LinearLightParts>;
}

const createRenderCache = (): RenderCache => ({
  source: new WeakMap(),
  grayscale: new WeakMap(),
  contour: null,
  filteredContour: null,
  denoisedContour: null,
  linearLightParts: new WeakMap(),
  grayscaleLinearLightParts: new WeakMap(),
});

// ImageData を drawImage 可能なキャンバスに変換
const imageDataToCanvas = (imageData: ImageData): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.putImageData(imageData, 0, 0);
  }
  return canvas;
};

const convertToGrayscale = (imageData: ImageData): ImageData => {
  const { width, height, data } = imageData;
  const grayscaleData = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

    grayscaleData.data[i] = brightness;
    grayscaleData.data[i + 1] = brightness;
    grayscaleData.data[i + 2] = brightness;
    grayscaleData.data[i + 3] = data[i + 3]!;
  }

  return grayscaleData;
};

// filtered画像から輝度データを生成するヘルパー関数
const createBrightnessDataFromFiltered = (filteredImageData: ImageData): BrightnessData => {
  const { width, height, data } = filteredImageData;
  const brightnessMap: number[][] = [];

  for (let y = 0; y < height; y++) {
    brightnessMap[y] = [];
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const r = data[pixelIndex] ?? 0;
      const g = data[pixelIndex + 1] ?? 0;
      const b = data[pixelIndex + 2] ?? 0;
      const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      brightnessMap[y]![x] = brightness;
    }
  }

  return {
    imageData: filteredImageData,
    brightnessMap,
    levels: [], // 空の配列を設定（使用されない）
    width,
    height
  };
};

const detectContours = (
  brightnessData: BrightnessData,
  settings: ContourSettings
): ImageData => {
  const { width, height, brightnessMap } = brightnessData;
  const contourData = new ImageData(width, height);
  const levelStep = 255 / settings.levels;

  // Base adjustment with brightness threshold and contrast enhancement
  const brightnessThreshold = settings.brightnessThreshold ?? 65; // Fixed threshold for optimal visibility
  const contrastSetting = settings.contourContrast ?? 0; // Default 0%
  const contrastStrength = contrastSetting / 100; // 0.0 to 1.0

  // Apply contour detection with simple adjacent brightness average
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const currentBrightness = brightnessMap[y]![x]!;
      const currentLevel = Math.floor(currentBrightness / levelStep);

      const neighbors = [
        brightnessMap[y - 1]![x]!,
        brightnessMap[y + 1]![x]!,
        brightnessMap[y]![x - 1]!,
        brightnessMap[y]![x + 1]!,
      ];

      let isContour = false;
      let adjacentBrightness = currentBrightness;

      for (const neighbor of neighbors) {
        const neighborLevel = Math.floor(neighbor / levelStep);
        if (Math.abs(currentLevel - neighborLevel) >= 1) {
          isContour = true;
          // Use average of current and different neighbor brightness
          adjacentBrightness = (currentBrightness + neighbor) / 2;
          break;
        }
      }

      const index = (y * width + x) * 4;
      if (isContour) {
        // Adaptive base adjustment based on brightness threshold
        const baseAdjustment = adjacentBrightness >= brightnessThreshold ? -25 : +75;
        const baseContourGray = adjacentBrightness + baseAdjustment;

        // Apply contrast enhancement based on adjustment type
        let contourGray;
        if (contrastStrength > 0) {
          if (baseAdjustment < 0) { // -25 case: make darker
            contourGray = baseContourGray * (1 - contrastStrength);
          } else { // +75 case: make brighter
            contourGray = baseContourGray + (255 - baseContourGray) * contrastStrength;
          }
        } else {
          contourGray = baseContourGray;
        }

        contourGray = Math.max(0, Math.min(255, contourGray));

        contourData.data[index] = contourGray;
        contourData.data[index + 1] = contourGray;
        contourData.data[index + 2] = contourGray;
        contourData.data[index + 3] = Math.floor(255 * (settings.transparency / 100));
      } else {
        contourData.data[index] = 0;
        contourData.data[index + 1] = 0;
        contourData.data[index + 2] = 0;
        contourData.data[index + 3] = 0;
      }
    }
  }

  return contourData;
};

// Optimized lightweight contour thinning
const thinContourLines = (contourData: ImageData, minDistance: number): ImageData => {
  const { width, height } = contourData;
  const thinned = new ImageData(width, height);

  if (minDistance <= 0) return contourData;

  // Use larger grid for better performance at cost of some precision
  const gridSize = Math.max(2, Math.ceil(minDistance * 1.2));
  const occupied = new Set<string>();

  // Single pass with optimized grid-based thinning
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;

      if (contourData.data[index + 3]! > 0) { // Has contour
        const gridX = Math.floor(x / gridSize);
        const gridY = Math.floor(y / gridSize);
        const gridKey = `${gridX},${gridY}`;

        // Simple grid check (no 9-neighborhood for better performance)
        if (!occupied.has(gridKey)) {
          occupied.add(gridKey);

          thinned.data[index] = contourData.data[index]!;
          thinned.data[index + 1] = contourData.data[index + 1]!;
          thinned.data[index + 2] = contourData.data[index + 2]!;
          thinned.data[index + 3] = contourData.data[index + 3]!;
        }
      }
    }
  }

  return thinned;
};

// Contour detection with optional thinning
const detectContoursWithThinning = (
  brightnessData: BrightnessData,
  settings: ContourSettings
): ImageData => {
  const contourData = detectContours(brightnessData, settings);

  if (settings.minContourDistance && settings.minContourDistance > 0) {
    return thinContourLines(contourData, settings.minContourDistance);
  }

  return contourData;
};

// Linear Light合成 base + 2*(overlay - 128) を Canvas合成で実現するため、
// overlay を加算成分 bright = max(0, 2*(overlay - 128)) と
// 減算成分 dark = max(0, 2*(128 - overlay)) に分解する（チャンネルごとに排他）。
// 合成時は base + bright - dark となり、元のピクセルループと同じ結果になる。
const createLinearLightParts = (overlay: ImageData): LinearLightParts => {
  const { width, height, data } = overlay;
  const bright = new ImageData(width, height);
  const dark = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const value = data[i + c]!;
      bright.data[i + c] = Math.max(0, 2 * value - 256);
      dark.data[i + c] = Math.max(0, 256 - 2 * value);
    }
    bright.data[i + 3] = 255;
    dark.data[i + 3] = 255;
  }

  return {
    bright: imageDataToCanvas(bright),
    dark: imageDataToCanvas(dark),
  };
};

// base + bright - dark を合成モードで計算する。
// 加算は 'lighter'、減算は「白との difference で反転 → 加算 → 再反転」で実現。
const applyLinearLight = (
  ctx: CanvasRenderingContext2D,
  parts: LinearLightParts,
  width: number,
  height: number
): void => {
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(parts.bright, 0, 0);

  ctx.globalCompositeOperation = 'difference';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(parts.dark, 0, 0);

  ctx.globalCompositeOperation = 'difference';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'source-over';
};

export const useCanvasRenderer = (): UseCanvasRendererReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<RenderCache>(createRenderCache());

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const renderWithLayers = useCallback((
    originalImageData: ImageData,
    brightnessData: BrightnessData | null,
    displayOptions: DisplayOptions,
    contourSettings: ContourSettings,
    inputs: RenderLayerInputs = {}
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const {
      filteredImageData = null,
      imageFilterOpacity = 100,
      denoisedImageData = null,
      denoiseOpacity = 100,
      frequencyData = null,
    } = inputs;

    const imageWidth = originalImageData.width;
    const imageHeight = originalImageData.height;

    // サイズ設定で canvas は透明にクリアされる
    canvas.width = imageWidth;
    canvas.height = imageHeight;

    const cache = cacheRef.current;
    const { layers, grayscaleMode } = displayOptions;

    // ソース画像のキャンバス（グレースケール変換込み）をキャッシュから取得
    const getLayerCanvas = (imageData: ImageData): HTMLCanvasElement => {
      const map = grayscaleMode ? cache.grayscale : cache.source;
      let layerCanvas = map.get(imageData);
      if (!layerCanvas) {
        layerCanvas = imageDataToCanvas(
          grayscaleMode ? convertToGrayscale(imageData) : imageData
        );
        map.set(imageData, layerCanvas);
      }
      return layerCanvas;
    };

    // 等高線キャンバスをキャッシュから取得（輝度データ・設定が変わったときだけ再計算）
    const getContourCanvas = (
      entryName: 'contour' | 'filteredContour' | 'denoisedContour',
      source: object,
      build: () => ImageData
    ): HTMLCanvasElement => {
      const settingsKey = JSON.stringify(contourSettings);
      let entry = cache[entryName];
      if (!entry || entry.source !== source || entry.settingsKey !== settingsKey) {
        entry = { source, settingsKey, canvas: imageDataToCanvas(build()) };
        cache[entryName] = entry;
      }
      return entry.canvas;
    };

    const getLinearLightParts = (overlay: ImageData): LinearLightParts => {
      const map = grayscaleMode ? cache.grayscaleLinearLightParts : cache.linearLightParts;
      let parts = map.get(overlay);
      if (!parts) {
        parts = createLinearLightParts(
          grayscaleMode ? convertToGrayscale(overlay) : overlay
        );
        map.set(overlay, parts);
      }
      return parts;
    };

    // 1. Original Layer
    if (layers.original) {
      ctx.drawImage(getLayerCanvas(originalImageData), 0, 0);
    }

    // 2. Filtered Layer
    if (layers.filtered) {
      if (filteredImageData) {
        // Originalと重ねる場合は opacity でブレンド、単独表示なら不透明
        ctx.globalAlpha = layers.original ? imageFilterOpacity / 100 : 1;
        ctx.drawImage(getLayerCanvas(filteredImageData), 0, 0);
        ctx.globalAlpha = 1;
      } else if (!layers.original) {
        // フィルター画像がない場合は元画像を表示
        ctx.drawImage(getLayerCanvas(originalImageData), 0, 0);
      }
    }

    // 2.5. Denoised Layer
    if (layers.denoised && denoisedImageData) {
      // 下にベース画像がある場合は opacity でブレンド、単独表示なら不透明
      const hasBaseUnder = layers.original || (layers.filtered && filteredImageData);
      ctx.globalAlpha = hasBaseUnder ? denoiseOpacity / 100 : 1;
      ctx.drawImage(getLayerCanvas(denoisedImageData), 0, 0);
      ctx.globalAlpha = 1;
    }

    // 3. Contour Layer (Original image contour)
    if (layers.contour && brightnessData) {
      const contourCanvas = getContourCanvas('contour', brightnessData, () =>
        detectContoursWithThinning(brightnessData, contourSettings)
      );
      ctx.drawImage(contourCanvas, 0, 0);
    }

    // 4. Filtered Contour Layer (Filtered image contour)
    if (layers.filteredContour && brightnessData && filteredImageData) {
      const filteredContourCanvas = getContourCanvas('filteredContour', filteredImageData, () =>
        detectContoursWithThinning(
          createBrightnessDataFromFiltered(filteredImageData),
          contourSettings
        )
      );
      ctx.drawImage(filteredContourCanvas, 0, 0);
    }

    // 4.5. Denoised Contour Layer (ノイズ除去後画像の等高線)
    if (layers.denoisedContour && brightnessData && denoisedImageData) {
      const denoisedContourCanvas = getContourCanvas('denoisedContour', denoisedImageData, () =>
        detectContoursWithThinning(
          createBrightnessDataFromFiltered(denoisedImageData),
          contourSettings
        )
      );
      ctx.drawImage(denoisedContourCanvas, 0, 0);
    }

    // 5. Frequency Layers
    if (frequencyData) {
      // Low Frequency Layer (ベースとして使用)
      if (layers.lowFrequency && frequencyData.lowFrequency) {
        ctx.drawImage(getLayerCanvas(frequencyData.lowFrequency), 0, 0);
      }

      // High Frequency Layers
      // Low Frequencyがオンの場合は Linear Light合成、オフの場合は通常合成でディテールのみ表示
      const highFrequencyLayers: [boolean, ImageData | null][] = [
        [layers.highFrequencyBright, frequencyData.highFrequencyBright],
        [layers.highFrequencyDark, frequencyData.highFrequencyDark],
        [layers.highFrequencyCombined, frequencyData.highFrequencyCombined],
      ];

      for (const [enabled, overlay] of highFrequencyLayers) {
        if (!enabled || !overlay) continue;

        if (layers.lowFrequency) {
          applyLinearLight(ctx, getLinearLightParts(overlay), imageWidth, imageHeight);
        } else {
          ctx.drawImage(getLayerCanvas(overlay), 0, 0);
        }
      }
    }
  }, []);

  return {
    canvasRef,
    renderWithLayers,
    clearCanvas,
  };
};
