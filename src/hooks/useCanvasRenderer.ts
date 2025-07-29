import { useCallback, useRef } from 'react';
import { BrightnessData, ContourSettings } from '../types/ImageTypes';
import { DisplayMode } from '../types/UITypes';

interface UseCanvasRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  renderImage: (
    originalImageData: ImageData,
    brightnessData: BrightnessData | null,
    edgeData: ImageData | null,
    displayMode: DisplayMode,
    contourSettings: ContourSettings,
    cannyOpacity?: number,
    denoisedImageData?: ImageData | null,
    noiseReductionOpacity?: number
  ) => void;
  clearCanvas: () => void;
}

export const useCanvasRenderer = (): UseCanvasRendererReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // denoised画像から輝度データを生成するヘルパー関数
  const createBrightnessDataFromDenoised = (denoisedImageData: ImageData): BrightnessData => {
    const { width, height, data } = denoisedImageData;
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
      imageData: denoisedImageData,
      brightnessMap,
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

  const combineWithDenoising = (
    base: ImageData,
    denoised: ImageData,
    opacity: number = 100
  ): ImageData => {
    const combined = new ImageData(base.width, base.height);
    const alpha = opacity / 100;
    
    for (let i = 0; i < base.data.length; i += 4) {
      const baseR = base.data[i]!;
      const baseG = base.data[i + 1]!;
      const baseB = base.data[i + 2]!;
      const baseA = base.data[i + 3]!;

      const denoisedR = denoised.data[i]!;
      const denoisedG = denoised.data[i + 1]!;
      const denoisedB = denoised.data[i + 2]!;
      const denoisedA = denoised.data[i + 3]!;

      combined.data[i] = baseR * (1 - alpha) + denoisedR * alpha;
      combined.data[i + 1] = baseG * (1 - alpha) + denoisedG * alpha;
      combined.data[i + 2] = baseB * (1 - alpha) + denoisedB * alpha;
      combined.data[i + 3] = Math.max(baseA, denoisedA);
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
    denoisedImageData: ImageData | null = null,
    noiseReductionOpacity: number = 100
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

      // Noise Reduction Display Modes
      case DisplayMode.DENOISED_ONLY:
        if (denoisedImageData) {
          finalImageData = denoisedImageData;
        } else {
          // ノイズリダクションが無効の場合は元画像を表示
          finalImageData = baseImageData;
        }
        break;

      case DisplayMode.DENOISED_GRAYSCALE_ONLY:
        if (denoisedImageData) {
          finalImageData = convertToGrayscale(denoisedImageData);
        } else {
          // ノイズリダクションが無効の場合はグレースケール元画像を表示
          finalImageData = convertToGrayscale(baseImageData);
        }
        break;

      case DisplayMode.DENOISED_CONTOUR_ONLY:
        if (denoisedImageData && brightnessData) {
          // ノイズ除去画像から輝度データを生成して等高線のみ表示
          const denoisedBrightnessData = createBrightnessDataFromDenoised(denoisedImageData);
          finalImageData = detectContours(denoisedBrightnessData, contourSettings);
        } else if (brightnessData) {
          // ノイズリダクションが無効の場合は通常の等高線のみ
          finalImageData = detectContours(brightnessData, contourSettings);
        }
        break;


      case DisplayMode.COLOR_WITH_DENOISED_CONTOUR:
        if (denoisedImageData && brightnessData) {
          // Apply noise reduction to the base image first
          const denoisedBase = combineWithDenoising(baseImageData, denoisedImageData, noiseReductionOpacity);
          // Create brightness data from denoised image for accurate contour detection
          const denoisedBrightnessData = createBrightnessDataFromDenoised(denoisedImageData);
          const contourData = detectContours(denoisedBrightnessData, contourSettings);
          finalImageData = combineImageData(denoisedBase, contourData);
        } else if (brightnessData) {
          // ノイズリダクションが無効の場合は通常の等高線表示
          const contourData = detectContours(brightnessData, contourSettings);
          finalImageData = combineImageData(baseImageData, contourData);
        }
        break;

      case DisplayMode.GRAYSCALE_WITH_DENOISED_CONTOUR:
        if (denoisedImageData && brightnessData) {
          // Apply noise reduction to the base image first
          const denoisedBase = combineWithDenoising(baseImageData, denoisedImageData, noiseReductionOpacity);
          // Convert to grayscale
          const grayscaleBase = convertToGrayscale(denoisedBase);
          // Create brightness data from denoised image for accurate contour detection
          const denoisedBrightnessData = createBrightnessDataFromDenoised(denoisedImageData);
          const contourData = detectContours(denoisedBrightnessData, contourSettings);
          finalImageData = combineImageData(grayscaleBase, contourData);
        } else if (brightnessData) {
          // ノイズリダクションが無効の場合はグレースケール通常等高線表示
          const grayscaleBase = convertToGrayscale(baseImageData);
          const contourData = detectContours(brightnessData, contourSettings);
          finalImageData = combineImageData(grayscaleBase, contourData);
        }
        break;

      case DisplayMode.DENOISED_WITH_CANNY:
        if (denoisedImageData && edgeData) {
          finalImageData = combineWithCannyEdges(denoisedImageData, edgeData, 'white', cannyOpacity);
        } else if (edgeData) {
          // ノイズリダクションが無効の場合は元画像+Cannyエッジ
          finalImageData = combineWithCannyEdges(baseImageData, edgeData, 'white', cannyOpacity);
        }
        break;

      case DisplayMode.ALL_WITH_DENOISING:
        if (denoisedImageData && brightnessData && edgeData) {
          // Apply noise reduction to the base image first
          const denoisedBase = combineWithDenoising(baseImageData, denoisedImageData, noiseReductionOpacity);
          // Create brightness data from denoised image for accurate contour detection
          const denoisedBrightnessData = createBrightnessDataFromDenoised(denoisedImageData);
          const contourData = detectContours(denoisedBrightnessData, contourSettings);
          const denoisedWithContour = combineImageData(denoisedBase, contourData);
          finalImageData = combineWithCannyEdges(denoisedWithContour, edgeData, 'white', cannyOpacity);
        } else if (brightnessData && edgeData) {
          // ノイズリダクションが無効の場合は通常の全機能合成
          const contourData = detectContours(brightnessData, contourSettings);
          const colorWithContour = combineImageData(baseImageData, contourData);
          finalImageData = combineWithCannyEdges(colorWithContour, edgeData, 'white', cannyOpacity);
        }
        break;

      case DisplayMode.ALL_WITH_DENOISING_GRAYSCALE:
        if (denoisedImageData && brightnessData && edgeData) {
          // Apply noise reduction to the base image first
          const denoisedBase = combineWithDenoising(baseImageData, denoisedImageData, noiseReductionOpacity);
          // Convert to grayscale
          const grayscaleBase = convertToGrayscale(denoisedBase);
          // Create brightness data from denoised image for accurate contour detection
          const denoisedBrightnessData = createBrightnessDataFromDenoised(denoisedImageData);
          const contourData = detectContours(denoisedBrightnessData, contourSettings);
          const denoisedWithContour = combineImageData(grayscaleBase, contourData);
          finalImageData = combineWithCannyEdges(denoisedWithContour, edgeData, 'white', cannyOpacity);
        } else if (brightnessData && edgeData) {
          // ノイズリダクションが無効の場合はグレースケール全機能合成
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

  return {
    canvasRef,
    renderImage,
    clearCanvas,
  };
};