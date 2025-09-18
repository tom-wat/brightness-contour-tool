import { useCallback, useRef } from 'react';
import { BrightnessData, ContourSettings } from '../types/ImageTypes';
import { DisplayMode, DisplayOptions } from '../types/UITypes';
import { FrequencyData } from '../types/FrequencyTypes';

interface UseCanvasRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  renderImage: (
    originalImageData: ImageData,
    brightnessData: BrightnessData | null,
    edgeData: ImageData | null,
    displayMode: DisplayMode,
    contourSettings: ContourSettings,
    cannyOpacity?: number,
    filteredImageData?: ImageData | null,
    imageFilterOpacity?: number
  ) => void;
  renderWithLayers: (
    originalImageData: ImageData,
    brightnessData: BrightnessData | null,
    edgeData: ImageData | null,
    filteredImageData: ImageData | null,
    displayOptions: DisplayOptions,
    contourSettings: ContourSettings,
    cannyOpacity?: number,
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
        for (const neighbor of neighbors) {
          const neighborLevel = Math.floor(neighbor / levelStep);
          if (Math.abs(currentLevel - neighborLevel) >= 1) {
            isContour = true;
            break;
          }
        }

        const index = (y * width + x) * 4;
        if (isContour) {
          // 輝度範囲に応じて適切なコントラストを持つグレー値を計算
          const levelRangeMin = (currentLevel / settings.levels) * 255;
          const levelRangeMax = ((currentLevel + 1) / settings.levels) * 255;
          const rangeMid = (levelRangeMin + levelRangeMax) / 2;
          
          // 現在の輝度が範囲の中央より明るいか暗いかで等高線色を決定
          let contourGray;
          if (currentBrightness > rangeMid) {
            // 明るい場合は少し暗めの線（視認性確保）
            contourGray = Math.max(0, levelRangeMin - 30);
          } else {
            // 暗い場合は少し明るめの線（視認性確保）
            contourGray = Math.min(255, levelRangeMax + 30);
          }
          
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

  // 透明背景対応の等高線検出関数
  const detectContoursTransparent = (
    brightnessData: BrightnessData,
    settings: ContourSettings
  ): ImageData => {
    const { width, height, brightnessMap } = brightnessData;
    const contourData = new ImageData(width, height);
    const levelStep = 255 / settings.levels;

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
        for (const neighbor of neighbors) {
          const neighborLevel = Math.floor(neighbor / levelStep);
          if (Math.abs(currentLevel - neighborLevel) >= 1) {
            isContour = true;
            break;
          }
        }

        const index = (y * width + x) * 4;
        if (isContour) {
          // 透明背景の場合は明るい色で等高線を描画（視認性確保）
          const contourGray = 200; // 明るいグレー
          
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

  const combineWithCannyEdges = (
    base: ImageData,
    edges: ImageData,
    edgeColor: 'white' | 'dark' = 'white',
    opacity: number = 100
  ): ImageData => {
    const combined = new ImageData(base.width, base.height);
    
    for (let i = 0; i < base.data.length; i += 4) {
      const baseR = base.data[i]!;
      const baseG = base.data[i + 1]!;
      const baseB = base.data[i + 2]!;
      const baseA = base.data[i + 3]!;

      const edgeR = edges.data[i]!;
      const edgeG = edges.data[i + 1]!;
      const edgeB = edges.data[i + 2]!;
      const edgeA = edges.data[i + 3]!;

      // エッジが存在する場合（白いピクセル）
      if (edgeA > 0 && (edgeR > 128 || edgeG > 128 || edgeB > 128)) {
        const edgeOpacity = (opacity / 100) * 255;
        const blendRatio = opacity / 100;
        
        if (edgeColor === 'dark') {
          // エッジは暗い色で表示（等高線との区別のため）
          const edgeColorValue = 40;
          combined.data[i] = baseR * (1 - blendRatio) + edgeColorValue * blendRatio;
          combined.data[i + 1] = baseG * (1 - blendRatio) + edgeColorValue * blendRatio;
          combined.data[i + 2] = baseB * (1 - blendRatio) + edgeColorValue * blendRatio;
          combined.data[i + 3] = Math.max(baseA, edgeOpacity);
        } else {
          // エッジは白色で表示
          combined.data[i] = baseR * (1 - blendRatio) + 255 * blendRatio;
          combined.data[i + 1] = baseG * (1 - blendRatio) + 255 * blendRatio;
          combined.data[i + 2] = baseB * (1 - blendRatio) + 255 * blendRatio;
          combined.data[i + 3] = Math.max(baseA, edgeOpacity);
        }
      } else {
        // エッジがない場合はベース画像を表示
        combined.data[i] = baseR;
        combined.data[i + 1] = baseG;
        combined.data[i + 2] = baseB;
        combined.data[i + 3] = baseA;
      }
    }

    return combined;
  };

  // 透明背景対応のCannyエッジ合成関数
  const combineWithCannyEdgesTransparent = (
    base: ImageData,
    edges: ImageData,
    edgeColor: 'white' | 'dark' = 'white',
    opacity: number = 100
  ): ImageData => {
    const combined = new ImageData(base.width, base.height);
    const alpha = opacity / 100;
    
    for (let i = 0; i < base.data.length; i += 4) {
      const baseR = base.data[i]!;
      const baseG = base.data[i + 1]!;
      const baseB = base.data[i + 2]!;
      const baseA = base.data[i + 3]!;

      const edgeAlpha = edges.data[i + 3]!;

      if (edgeAlpha > 0) {
        // エッジがある場合
        const blendRatio = alpha * (edgeAlpha / 255);
        const edgeOpacity = Math.floor(255 * blendRatio);
        
        if (edgeColor === 'dark') {
          // 暗色のエッジ（透明背景でも視認性良好）
          combined.data[i] = baseR * (1 - blendRatio) + 50 * blendRatio;
          combined.data[i + 1] = baseG * (1 - blendRatio) + 50 * blendRatio;
          combined.data[i + 2] = baseB * (1 - blendRatio) + 50 * blendRatio;
          combined.data[i + 3] = Math.max(baseA, edgeOpacity);
        } else {
          // 白色のエッジ（透明背景でも視認性良好）
          combined.data[i] = baseR * (1 - blendRatio) + 255 * blendRatio;
          combined.data[i + 1] = baseG * (1 - blendRatio) + 255 * blendRatio;
          combined.data[i + 2] = baseB * (1 - blendRatio) + 255 * blendRatio;
          combined.data[i + 3] = Math.max(baseA, edgeOpacity);
        }
      } else {
        // エッジがない場合はベース画像をそのまま使用
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
    edgeData: ImageData | null,
    displayMode: DisplayMode,
    contourSettings: ContourSettings,
    cannyOpacity: number = 100,
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
          finalImageData = detectContours(brightnessData, contourSettings);
        }
        break;

      case DisplayMode.COLOR_WITH_CONTOUR:
        if (brightnessData) {
          const contourData = detectContours(brightnessData, contourSettings);
          finalImageData = combineImageData(baseImageData, contourData);
        }
        break;

      case DisplayMode.GRAYSCALE_WITH_CONTOUR:
        if (brightnessData) {
          const grayscaleData = convertToGrayscale(baseImageData);
          const contourData = detectContours(brightnessData, contourSettings);
          finalImageData = combineImageData(grayscaleData, contourData);
        }
        break;

      case DisplayMode.CANNY_EDGE_ONLY:
        if (edgeData) {
          // Create black background for edge visibility
          const blackBackground = new ImageData(edgeData.width, edgeData.height);
          for (let i = 0; i < blackBackground.data.length; i += 4) {
            blackBackground.data[i] = 0;     // R
            blackBackground.data[i + 1] = 0; // G
            blackBackground.data[i + 2] = 0; // B
            blackBackground.data[i + 3] = 255; // A
          }
          finalImageData = combineImageData(blackBackground, edgeData);
        }
        break;

      case DisplayMode.COLOR_WITH_CANNY:
        if (edgeData) {
          finalImageData = combineWithCannyEdges(baseImageData, edgeData, 'white', cannyOpacity);
        }
        break;

      case DisplayMode.CONTOUR_WITH_CANNY:
        if (brightnessData && edgeData) {
          const contourData = detectContours(brightnessData, contourSettings);
          finalImageData = combineWithCannyEdges(contourData, edgeData, 'dark', cannyOpacity);
        }
        break;

      case DisplayMode.GRAYSCALE_WITH_CONTOUR_AND_CANNY:
        if (brightnessData && edgeData) {
          const grayscaleData = convertToGrayscale(baseImageData);
          const contourData = detectContours(brightnessData, contourSettings);
          const grayscaleWithContour = combineImageData(grayscaleData, contourData);
          finalImageData = combineWithCannyEdges(grayscaleWithContour, edgeData, 'white', cannyOpacity);
        }
        break;

      case DisplayMode.COLOR_WITH_CONTOUR_AND_CANNY:
        if (brightnessData && edgeData) {
          const contourData = detectContours(brightnessData, contourSettings);
          const colorWithContour = combineImageData(baseImageData, contourData);
          finalImageData = combineWithCannyEdges(colorWithContour, edgeData, 'white', cannyOpacity);
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
          finalImageData = detectContours(filteredBrightnessData, contourSettings);
        } else if (brightnessData) {
          // 画像フィルタが無効の場合は通常の等高線のみ
          finalImageData = detectContours(brightnessData, contourSettings);
        }
        break;


      case DisplayMode.COLOR_WITH_DENOISED_CONTOUR:
        if (filteredImageData && brightnessData) {
          // Apply image filter to the base image first
          const filteredBase = combineWithFiltering(baseImageData, filteredImageData, imageFilterOpacity);
          // Create brightness data from filtered image for accurate contour detection
          const filteredBrightnessData = createBrightnessDataFromFiltered(filteredImageData);
          const contourData = detectContours(filteredBrightnessData, contourSettings);
          finalImageData = combineImageData(filteredBase, contourData);
        } else if (brightnessData) {
          // 画像フィルタが無効の場合は通常の等高線表示
          const contourData = detectContours(brightnessData, contourSettings);
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
          const contourData = detectContours(filteredBrightnessData, contourSettings);
          finalImageData = combineImageData(grayscaleBase, contourData);
        } else if (brightnessData) {
          // 画像フィルタが無効の場合はグレースケール通常等高線表示
          const grayscaleBase = convertToGrayscale(baseImageData);
          const contourData = detectContours(brightnessData, contourSettings);
          finalImageData = combineImageData(grayscaleBase, contourData);
        }
        break;

      case DisplayMode.DENOISED_WITH_CANNY:
        if (filteredImageData && edgeData) {
          finalImageData = combineWithCannyEdges(filteredImageData, edgeData, 'white', cannyOpacity);
        } else if (edgeData) {
          // 画像フィルタが無効の場合は元画像+Cannyエッジ
          finalImageData = combineWithCannyEdges(baseImageData, edgeData, 'white', cannyOpacity);
        }
        break;

      case DisplayMode.ALL_WITH_DENOISING:
        if (filteredImageData && brightnessData && edgeData) {
          // Apply image filter to the base image first
          const filteredBase = combineWithFiltering(baseImageData, filteredImageData, imageFilterOpacity);
          // Create brightness data from filtered image for accurate contour detection
          const filteredBrightnessData = createBrightnessDataFromFiltered(filteredImageData);
          const contourData = detectContours(filteredBrightnessData, contourSettings);
          const filteredWithContour = combineImageData(filteredBase, contourData);
          finalImageData = combineWithCannyEdges(filteredWithContour, edgeData, 'white', cannyOpacity);
        } else if (brightnessData && edgeData) {
          // 画像フィルタが無効の場合は通常の全機能合成
          const contourData = detectContours(brightnessData, contourSettings);
          const colorWithContour = combineImageData(baseImageData, contourData);
          finalImageData = combineWithCannyEdges(colorWithContour, edgeData, 'white', cannyOpacity);
        }
        break;

      case DisplayMode.ALL_WITH_DENOISING_GRAYSCALE:
        if (filteredImageData && brightnessData && edgeData) {
          // Apply image filter to the base image first
          const filteredBase = combineWithFiltering(baseImageData, filteredImageData, imageFilterOpacity);
          // Convert to grayscale
          const grayscaleBase = convertToGrayscale(filteredBase);
          // Create brightness data from filtered image for accurate contour detection
          const filteredBrightnessData = createBrightnessDataFromFiltered(filteredImageData);
          const contourData = detectContours(filteredBrightnessData, contourSettings);
          const filteredWithContour = combineImageData(grayscaleBase, contourData);
          finalImageData = combineWithCannyEdges(filteredWithContour, edgeData, 'white', cannyOpacity);
        } else if (brightnessData && edgeData) {
          // 画像フィルタが無効の場合はグレースケール全機能合成
          const grayscaleBase = convertToGrayscale(baseImageData);
          const contourData = detectContours(brightnessData, contourSettings);
          const grayscaleWithContour = combineImageData(grayscaleBase, contourData);
          finalImageData = combineWithCannyEdges(grayscaleWithContour, edgeData, 'white', cannyOpacity);
        }
        break;

      default:
        finalImageData = baseImageData;
        break;
    }

    ctx.putImageData(finalImageData, 0, 0);
  }, []);

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
    edgeData: ImageData | null,
    filteredImageData: ImageData | null,
    displayOptions: DisplayOptions,
    contourSettings: ContourSettings,
    cannyOpacity: number = 100,
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
        detectContours(brightnessData, contourSettings) :
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
          detectContours(filteredBrightnessData, contourSettings) :
          detectContoursTransparent(filteredBrightnessData, contourSettings);
        
        baseImageData = hasBaseImage ? 
          combineImageData(baseImageData, filteredContourData) :
          combineImageDataTransparent(baseImageData, filteredContourData);
      } else {
        // フィルター画像がない場合は元画像のcontourを表示
        const contourData = hasBaseImage ? 
          detectContours(brightnessData, contourSettings) :
          detectContoursTransparent(brightnessData, contourSettings);
        
        baseImageData = hasBaseImage ? 
          combineImageData(baseImageData, contourData) :
          combineImageDataTransparent(baseImageData, contourData);
      }
    }

    // 5. Edge Layer
    if (displayOptions.layers.edge && edgeData) {
      const edgeColor = displayOptions.grayscaleMode ||
                      ((displayOptions.layers.contour || displayOptions.layers.filteredContour) &&
                       !displayOptions.layers.original && !displayOptions.layers.filtered) ?
                      'dark' : 'white';

      baseImageData = hasBaseImage ?
        combineWithCannyEdges(baseImageData, edgeData, edgeColor, cannyOpacity) :
        combineWithCannyEdgesTransparent(baseImageData, edgeData, edgeColor, cannyOpacity);
    }

    // 6. Frequency Layers
    if (frequencyData) {
      // Low Frequency Layer (ベースとして使用)
      if (displayOptions.layers.lowFrequency && frequencyData.lowFrequency) {
        baseImageData = hasBaseImage ?
          combineImageData(baseImageData, frequencyData.lowFrequency) :
          combineImageDataTransparent(baseImageData, frequencyData.lowFrequency);
      }

      // High Frequency Bright Layer
      if (displayOptions.layers.highFrequencyBright && frequencyData.highFrequencyBright) {
        if (displayOptions.layers.lowFrequency) {
          // Low Frequencyがオンの場合: Linear Light合成
          baseImageData = combineWithLinearLight(baseImageData, frequencyData.highFrequencyBright);
        } else {
          // Low Frequencyがオフの場合: 通常合成でディテールのみ表示
          baseImageData = hasBaseImage ?
            combineImageData(baseImageData, frequencyData.highFrequencyBright) :
            combineImageDataTransparent(baseImageData, frequencyData.highFrequencyBright);
        }
      }

      // High Frequency Dark Layer
      if (displayOptions.layers.highFrequencyDark && frequencyData.highFrequencyDark) {
        if (displayOptions.layers.lowFrequency) {
          // Low Frequencyがオンの場合: Linear Light合成
          baseImageData = combineWithLinearLight(baseImageData, frequencyData.highFrequencyDark);
        } else {
          // Low Frequencyがオフの場合: 通常合成でディテールのみ表示
          baseImageData = hasBaseImage ?
            combineImageData(baseImageData, frequencyData.highFrequencyDark) :
            combineImageDataTransparent(baseImageData, frequencyData.highFrequencyDark);
        }
      }
    }

    ctx.putImageData(baseImageData, 0, 0);
  }, []);

  return {
    canvasRef,
    renderImage,
    renderWithLayers,
    clearCanvas,
  };
};