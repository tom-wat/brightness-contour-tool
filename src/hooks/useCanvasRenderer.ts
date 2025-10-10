import { useCallback, useRef } from 'react';
import { BrightnessData, ContourSettings } from '../types/ImageTypes';
import { DisplayMode, DisplayOptions } from '../types/UITypes';
import { FrequencyData } from '../types/FrequencyTypes';

interface UseCanvasRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  renderImage: (
    originalImageData: ImageData,
    brightnessData: BrightnessData | null,
    displayMode: DisplayMode,
    contourSettings: ContourSettings,
    filteredImageData?: ImageData | null,
    imageFilterOpacity?: number
  ) => void;
  renderWithLayers: (
    originalImageData: ImageData,
    brightnessData: BrightnessData | null,
    filteredImageData: ImageData | null,
    displayOptions: DisplayOptions,
    contourSettings: ContourSettings,
    imageFilterOpacity?: number,
    frequencyData?: FrequencyData | null
  ) => void;
  clearCanvas: () => void;
}

export const useCanvasRenderer = (): UseCanvasRendererReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // filtered画像から輝度データを生成するヘルパー関数
  const createBrightnessDataFromFiltered = (filteredImageData: ImageData): BrightnessData => {
    const { width, height, data } = filteredImageData;
    const brightnessMap: number[][] = [];
    
    // denoised画像から輝度値を再計算して2次元配列に格納
    for (let y = 0; y < height; y++) {
      brightnessMap[y] = [];
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const r = data[pixelIndex] ?? 0;
        const g = data[pixelIndex + 1] ?? 0;
        const b = data[pixelIndex + 2] ?? 0;
        // 輝度計算（ITU-R BT.709標準）
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

    const startTime = performance.now();

    // Use larger grid for better performance at cost of some precision
    const gridSize = Math.max(2, Math.ceil(minDistance * 1.2));
    const occupied = new Set<string>();

    let originalCount = 0;
    let keptCount = 0;

    // Single pass with optimized grid-based thinning
    for (let y = 0; y < height; y += 1) { // Process every pixel
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;

        if (contourData.data[index + 3]! > 0) { // Has contour
          originalCount++;

          // Calculate grid position
          const gridX = Math.floor(x / gridSize);
          const gridY = Math.floor(y / gridSize);
          const gridKey = `${gridX},${gridY}`;

          // Simple grid check (no 9-neighborhood for better performance)
          if (!occupied.has(gridKey)) {
            occupied.add(gridKey);
            keptCount++;

            // Copy the contour pixel to thinned image
            thinned.data[index] = contourData.data[index]!;
            thinned.data[index + 1] = contourData.data[index + 1]!;
            thinned.data[index + 2] = contourData.data[index + 2]!;
            thinned.data[index + 3] = contourData.data[index + 3]!;
          }
        }
      }
    }

    const endTime = performance.now();

    // Debug: Log thinning performance
    if (originalCount > 10000) { // Only log for large images
      console.log(`Fast thinning: ${originalCount} → ${keptCount} pixels (${minDistance}px) in ${(endTime - startTime).toFixed(1)}ms`);
    }

    return thinned;
  };

  // Enhanced contour detection with optional thinning
  const detectContoursWithThinning = useCallback((
    brightnessData: BrightnessData,
    settings: ContourSettings
  ): ImageData => {
    const contourData = detectContours(brightnessData, settings);

    // Apply thinning when enabled (any level)
    const shouldThin = settings.minContourDistance && settings.minContourDistance > 0;

    console.log(`🔍 Regular thinning check: levels=${settings.levels}, minDistance=${settings.minContourDistance}, shouldThin=${shouldThin}`);

    if (shouldThin) {
      console.log(`✂️ Applying regular thinning with distance=${settings.minContourDistance}`);
      return thinContourLines(contourData, settings.minContourDistance!);
    } else {
      console.log(`⏭️ Skipping regular thinning - minDistance is 0`);
    }

    return contourData;
  }, []);

  // Enhanced transparent contour detection with optional thinning
  const detectContoursTransparentWithThinning = useCallback((
    brightnessData: BrightnessData,
    settings: ContourSettings
  ): ImageData => {
    const contourData = detectContoursTransparent(brightnessData, settings);

    // Apply thinning when enabled (any level)
    const shouldThin = settings.minContourDistance && settings.minContourDistance > 0;

    console.log(`🔍 Transparent thinning check: levels=${settings.levels}, minDistance=${settings.minContourDistance}, shouldThin=${shouldThin}`);

    if (shouldThin) {
      console.log(`✂️ Applying transparent thinning with distance=${settings.minContourDistance}`);
      return thinContourLines(contourData, settings.minContourDistance!);
    } else {
      console.log(`⏭️ Skipping transparent thinning - minDistance is 0`);
    }

    return contourData;
  }, []);

  // 透明背景対応の等高線検出関数
  const detectContoursTransparent = (
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
          contourData.data[index + 3] = 0; // 透明
        }
      }
    }

    return contourData;
  };


  const combineImageData = (
    base: ImageData,
    overlay: ImageData,
    blendMode: 'normal' | 'multiply' = 'normal'
  ): ImageData => {
    const combined = new ImageData(base.width, base.height);
    
    for (let i = 0; i < base.data.length; i += 4) {
      const baseR = base.data[i]!;
      const baseG = base.data[i + 1]!;
      const baseB = base.data[i + 2]!;
      const baseA = base.data[i + 3]!;

      const overlayR = overlay.data[i]!;
      const overlayG = overlay.data[i + 1]!;
      const overlayB = overlay.data[i + 2]!;
      const overlayA = overlay.data[i + 3]!;

      const alpha = overlayA / 255;

      if (blendMode === 'multiply' && overlayA > 0) {
        combined.data[i] = Math.min(255, baseR * (overlayR / 255));
        combined.data[i + 1] = Math.min(255, baseG * (overlayG / 255));
        combined.data[i + 2] = Math.min(255, baseB * (overlayB / 255));
      } else {
        combined.data[i] = baseR * (1 - alpha) + overlayR * alpha;
        combined.data[i + 1] = baseG * (1 - alpha) + overlayG * alpha;
        combined.data[i + 2] = baseB * (1 - alpha) + overlayB * alpha;
      }
      
      combined.data[i + 3] = Math.max(baseA, overlayA);
    }

    return combined;
  };

  // 透明背景対応の画像合成関数
  const combineImageDataTransparent = (
    base: ImageData,
    overlay: ImageData
  ): ImageData => {
    const combined = new ImageData(base.width, base.height);
    
    for (let i = 0; i < base.data.length; i += 4) {
      const baseR = base.data[i]!;
      const baseG = base.data[i + 1]!;
      const baseB = base.data[i + 2]!;
      const baseA = base.data[i + 3]!;

      const overlayR = overlay.data[i]!;
      const overlayG = overlay.data[i + 1]!;
      const overlayB = overlay.data[i + 2]!;
      const overlayA = overlay.data[i + 3]!;

      // アルファブレンディング
      if (overlayA > 0) {
        const alpha = overlayA / 255;
        const invAlpha = 1 - alpha;
        
        combined.data[i] = baseR * invAlpha + overlayR * alpha;
        combined.data[i + 1] = baseG * invAlpha + overlayG * alpha;
        combined.data[i + 2] = baseB * invAlpha + overlayB * alpha;
        combined.data[i + 3] = Math.max(baseA, overlayA);
      } else {
        // オーバーレイが透明な場合はベースをそのまま使用
        combined.data[i] = baseR;
        combined.data[i + 1] = baseG;
        combined.data[i + 2] = baseB;
        combined.data[i + 3] = baseA;
      }
    }

    return combined;
  };



  const combineWithFiltering = (
    base: ImageData,
    filtered: ImageData,
    opacity: number = 100
  ): ImageData => {
    const combined = new ImageData(base.width, base.height);
    const alpha = opacity / 100;
    
    for (let i = 0; i < base.data.length; i += 4) {
      const baseR = base.data[i]!;
      const baseG = base.data[i + 1]!;
      const baseB = base.data[i + 2]!;
      const baseA = base.data[i + 3]!;

      const filteredR = filtered.data[i]!;
      const filteredG = filtered.data[i + 1]!;
      const filteredB = filtered.data[i + 2]!;
      const filteredA = filtered.data[i + 3]!;

      combined.data[i] = baseR * (1 - alpha) + filteredR * alpha;
      combined.data[i + 1] = baseG * (1 - alpha) + filteredG * alpha;
      combined.data[i + 2] = baseB * (1 - alpha) + filteredB * alpha;
      combined.data[i + 3] = Math.max(baseA, filteredA);
    }

    return combined;
  };

  // Linear Light合成モード（Photoshop互換）
  const combineWithLinearLight = (
    baseImageData: ImageData,
    overlayImageData: ImageData
  ): ImageData => {
    const combined = new ImageData(
      new Uint8ClampedArray(baseImageData.data),
      baseImageData.width,
      baseImageData.height
    );

    for (let i = 0; i < combined.data.length; i += 4) {
      const baseR = combined.data[i] || 0;
      const baseG = combined.data[i + 1] || 0;
      const baseB = combined.data[i + 2] || 0;

      const overlayR = overlayImageData.data[i] || 0;
      const overlayG = overlayImageData.data[i + 1] || 0;
      const overlayB = overlayImageData.data[i + 2] || 0;

      // Linear Light合成式: Base + 2 * (Overlay - 128)
      // Photoshopの Linear Light ブレンドモードと同等
      combined.data[i] = Math.min(255, Math.max(0, baseR + 2 * (overlayR - 128)));
      combined.data[i + 1] = Math.min(255, Math.max(0, baseG + 2 * (overlayG - 128)));
      combined.data[i + 2] = Math.min(255, Math.max(0, baseB + 2 * (overlayB - 128)));
      // アルファチャンネルは元のまま
      combined.data[i + 3] = baseImageData.data[i + 3] || 255;
    }

    return combined;
  };

  const renderImage = useCallback((
    originalImageData: ImageData,
    brightnessData: BrightnessData | null,
    displayMode: DisplayMode,
    contourSettings: ContourSettings,
    filteredImageData: ImageData | null = null,
    imageFilterOpacity: number = 100
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas サイズを設定
    const imageWidth = originalImageData.width;
    const imageHeight = originalImageData.height;
    
    canvas.width = imageWidth;
    canvas.height = imageHeight;

    let finalImageData = originalImageData;

    // ぼかし処理が適用されている場合は、ぼかした画像を使用
    const baseImageData = brightnessData ? brightnessData.imageData : originalImageData;

    switch (displayMode) {
      case DisplayMode.COLOR_ONLY:
        finalImageData = baseImageData;
        break;

      case DisplayMode.GRAYSCALE_ONLY:
        finalImageData = convertToGrayscale(baseImageData);
        break;

      case DisplayMode.CONTOUR_ONLY:
        if (brightnessData) {
          finalImageData = detectContoursWithThinning(brightnessData, contourSettings);
        }
        break;

      case DisplayMode.COLOR_WITH_CONTOUR:
        if (brightnessData) {
          const contourData = detectContoursWithThinning(brightnessData, contourSettings);
          finalImageData = combineImageData(baseImageData, contourData);
        }
        break;

      case DisplayMode.GRAYSCALE_WITH_CONTOUR:
        if (brightnessData) {
          const grayscaleData = convertToGrayscale(baseImageData);
          const contourData = detectContoursWithThinning(brightnessData, contourSettings);
          finalImageData = combineImageData(grayscaleData, contourData);
        }
        break;






      // Image Filter Display Modes
      case DisplayMode.DENOISED_ONLY:
        if (filteredImageData) {
          finalImageData = filteredImageData;
        } else {
          // 画像フィルタが無効の場合は元画像を表示
          finalImageData = baseImageData;
        }
        break;

      case DisplayMode.DENOISED_GRAYSCALE_ONLY:
        if (filteredImageData) {
          finalImageData = convertToGrayscale(filteredImageData);
        } else {
          // 画像フィルタが無効の場合はグレースケール元画像を表示
          finalImageData = convertToGrayscale(baseImageData);
        }
        break;

      case DisplayMode.DENOISED_CONTOUR_ONLY:
        if (filteredImageData && brightnessData) {
          // 画像フィルタ画像から輝度データを生成して等高線のみ表示
          const filteredBrightnessData = createBrightnessDataFromFiltered(filteredImageData);
          finalImageData = detectContoursWithThinning(filteredBrightnessData, contourSettings);
        } else if (brightnessData) {
          // 画像フィルタが無効の場合は通常の等高線のみ
          finalImageData = detectContoursWithThinning(brightnessData, contourSettings);
        }
        break;


      case DisplayMode.COLOR_WITH_DENOISED_CONTOUR:
        if (filteredImageData && brightnessData) {
          // Apply image filter to the base image first
          const filteredBase = combineWithFiltering(baseImageData, filteredImageData, imageFilterOpacity);
          // Create brightness data from filtered image for accurate contour detection
          const filteredBrightnessData = createBrightnessDataFromFiltered(filteredImageData);
          const contourData = detectContoursWithThinning(filteredBrightnessData, contourSettings);
          finalImageData = combineImageData(filteredBase, contourData);
        } else if (brightnessData) {
          // 画像フィルタが無効の場合は通常の等高線表示
          const contourData = detectContoursWithThinning(brightnessData, contourSettings);
          finalImageData = combineImageData(baseImageData, contourData);
        }
        break;

      case DisplayMode.GRAYSCALE_WITH_DENOISED_CONTOUR:
        if (filteredImageData && brightnessData) {
          // Apply image filter to the base image first
          const filteredBase = combineWithFiltering(baseImageData, filteredImageData, imageFilterOpacity);
          // Convert to grayscale
          const grayscaleBase = convertToGrayscale(filteredBase);
          // Create brightness data from filtered image for accurate contour detection
          const filteredBrightnessData = createBrightnessDataFromFiltered(filteredImageData);
          const contourData = detectContoursWithThinning(filteredBrightnessData, contourSettings);
          finalImageData = combineImageData(grayscaleBase, contourData);
        } else if (brightnessData) {
          // 画像フィルタが無効の場合はグレースケール通常等高線表示
          const grayscaleBase = convertToGrayscale(baseImageData);
          const contourData = detectContoursWithThinning(brightnessData, contourSettings);
          finalImageData = combineImageData(grayscaleBase, contourData);
        }
        break;




      default:
        finalImageData = baseImageData;
        break;
    }

    ctx.putImageData(finalImageData, 0, 0);
  }, [detectContoursWithThinning]);

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
    filteredImageData: ImageData | null,
    displayOptions: DisplayOptions,
    contourSettings: ContourSettings,
    imageFilterOpacity: number = 100,
    frequencyData: FrequencyData | null = null
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas サイズを設定
    const imageWidth = originalImageData.width;
    const imageHeight = originalImageData.height;
    
    canvas.width = imageWidth;
    canvas.height = imageHeight;

    // 背景を決定（Original/Filteredがない場合は透明背景）
    const hasBaseImage = displayOptions.layers.original || (displayOptions.layers.filtered && filteredImageData);
    
    let baseImageData: ImageData;
    
    if (hasBaseImage) {
      // ベース画像がある場合は黒背景で初期化
      const blackBackground = new ImageData(imageWidth, imageHeight);
      for (let i = 0; i < blackBackground.data.length; i += 4) {
        blackBackground.data[i] = 0;     // R
        blackBackground.data[i + 1] = 0; // G
        blackBackground.data[i + 2] = 0; // B
        blackBackground.data[i + 3] = 255; // A
      }
      baseImageData = blackBackground;
    } else {
      // ベース画像がない場合は透明背景で初期化
      const transparentBackground = new ImageData(imageWidth, imageHeight);
      for (let i = 0; i < transparentBackground.data.length; i += 4) {
        transparentBackground.data[i] = 0;     // R
        transparentBackground.data[i + 1] = 0; // G
        transparentBackground.data[i + 2] = 0; // B
        transparentBackground.data[i + 3] = 0; // A (透明)
      }
      baseImageData = transparentBackground;
    }

    // 1. Original Layer
    if (displayOptions.layers.original) {
      const originalToUse = displayOptions.grayscaleMode ? convertToGrayscale(originalImageData) : originalImageData;
      baseImageData = originalToUse;
    }

    // 2. Filtered Layer
    if (displayOptions.layers.filtered) {
      if (filteredImageData) {
        const filteredToUse = displayOptions.grayscaleMode ? convertToGrayscale(filteredImageData) : filteredImageData;
        baseImageData = displayOptions.layers.original ? 
          combineWithFiltering(baseImageData, filteredToUse, imageFilterOpacity) : 
          filteredToUse;
      } else {
        // フィルター画像がない場合は元画像を表示
        const originalToUse = displayOptions.grayscaleMode ? convertToGrayscale(originalImageData) : originalImageData;
        if (!displayOptions.layers.original) {
          baseImageData = originalToUse;
        }
      }
    }

    // 3. Contour Layer (Original image contour)
    if (displayOptions.layers.contour && brightnessData) {
      // 常にオリジナル画像の輝度データを使用
      const contourData = hasBaseImage ? 
        detectContoursWithThinning(brightnessData, contourSettings) :
        detectContoursTransparent(brightnessData, contourSettings);
      
      baseImageData = hasBaseImage ? 
        combineImageData(baseImageData, contourData) :
        combineImageDataTransparent(baseImageData, contourData);
    }

    // 4. Filtered Contour Layer (Filtered image contour)
    if (displayOptions.layers.filteredContour && brightnessData) {
      if (filteredImageData) {
        // フィルタリングされた画像の輝度データを使用
        const filteredBrightnessData = createBrightnessDataFromFiltered(filteredImageData);
        
        const filteredContourData = hasBaseImage ?
          detectContoursWithThinning(filteredBrightnessData, contourSettings) :
          detectContoursTransparentWithThinning(filteredBrightnessData, contourSettings);
        
        baseImageData = hasBaseImage ? 
          combineImageData(baseImageData, filteredContourData) :
          combineImageDataTransparent(baseImageData, filteredContourData);
      } else {
        // フィルター画像がない場合は元画像のcontourを表示
        const contourData = hasBaseImage ? 
          detectContoursWithThinning(brightnessData, contourSettings) :
          detectContoursTransparent(brightnessData, contourSettings);
        
        baseImageData = hasBaseImage ? 
          combineImageData(baseImageData, contourData) :
          combineImageDataTransparent(baseImageData, contourData);
      }
    }


    // 6. Frequency Layers
    if (frequencyData) {
      // Low Frequency Layer (ベースとして使用)
      if (displayOptions.layers.lowFrequency && frequencyData.lowFrequency) {
        const lowFreqToUse = displayOptions.grayscaleMode ?
          convertToGrayscale(frequencyData.lowFrequency) :
          frequencyData.lowFrequency;
        baseImageData = hasBaseImage ?
          combineImageData(baseImageData, lowFreqToUse) :
          combineImageDataTransparent(baseImageData, lowFreqToUse);
      }

      // High Frequency Bright Layer
      if (displayOptions.layers.highFrequencyBright && frequencyData.highFrequencyBright) {
        const highFreqBrightToUse = displayOptions.grayscaleMode ?
          convertToGrayscale(frequencyData.highFrequencyBright) :
          frequencyData.highFrequencyBright;
        if (displayOptions.layers.lowFrequency) {
          // Low Frequencyがオンの場合: Linear Light合成
          baseImageData = combineWithLinearLight(baseImageData, highFreqBrightToUse);
        } else {
          // Low Frequencyがオフの場合: 通常合成でディテールのみ表示
          baseImageData = hasBaseImage ?
            combineImageData(baseImageData, highFreqBrightToUse) :
            combineImageDataTransparent(baseImageData, highFreqBrightToUse);
        }
      }

      // High Frequency Dark Layer
      if (displayOptions.layers.highFrequencyDark && frequencyData.highFrequencyDark) {
        const highFreqDarkToUse = displayOptions.grayscaleMode ?
          convertToGrayscale(frequencyData.highFrequencyDark) :
          frequencyData.highFrequencyDark;
        if (displayOptions.layers.lowFrequency) {
          // Low Frequencyがオンの場合: Linear Light合成
          baseImageData = combineWithLinearLight(baseImageData, highFreqDarkToUse);
        } else {
          // Low Frequencyがオフの場合: 通常合成でディテールのみ表示
          baseImageData = hasBaseImage ?
            combineImageData(baseImageData, highFreqDarkToUse) :
            combineImageDataTransparent(baseImageData, highFreqDarkToUse);
        }
      }
    }

    ctx.putImageData(baseImageData, 0, 0);
  }, [detectContoursWithThinning, detectContoursTransparentWithThinning]);

  return {
    canvasRef,
    renderImage,
    renderWithLayers,
    clearCanvas,
  };
};