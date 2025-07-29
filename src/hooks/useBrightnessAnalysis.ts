import { useState, useCallback, useRef } from 'react';
import { BrightnessData, ContourSettings } from '../types/ImageTypes';

interface UseBrightnessAnalysisReturn {
  brightnessData: BrightnessData | null;
  isProcessing: boolean;
  error: string | null;
  analyzeBrightness: (imageData: ImageData, settings: ContourSettings) => Promise<void>;
  clearAnalysis: () => void;
}

export const useBrightnessAnalysis = (): UseBrightnessAnalysisReturn => {
  const [brightnessData, setBrightnessData] = useState<BrightnessData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ガウシアンブラーのキャッシュ
  const blurCacheRef = useRef<Map<string, ImageData>>(new Map());

  const calculateBrightness = (r: number, g: number, b: number): number => {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  const createGaussianKernel = useCallback((radius: number): number[][] => {
    const size = Math.ceil(radius * 2) * 2 + 1;
    const kernel: number[][] = [];
    const sigma = radius / 3;
    const twoSigmaSquare = 2 * sigma * sigma;
    let sum = 0;

    for (let y = 0; y < size; y++) {
      kernel[y] = [];
      for (let x = 0; x < size; x++) {
        const dx = x - Math.floor(size / 2);
        const dy = y - Math.floor(size / 2);
        const distance = dx * dx + dy * dy;
        const value = Math.exp(-distance / twoSigmaSquare);
        kernel[y]![x] = value;
        sum += value;
      }
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        kernel[y]![x]! /= sum;
      }
    }

    return kernel;
  }, []);

  const applyGaussianBlur = useCallback((imageData: ImageData, radius: number): ImageData => {
    if (radius === 0) return imageData;

    const { width, height, data } = imageData;
    const blurred = new ImageData(width, height);
    const kernel = createGaussianKernel(radius);
    const kernelSize = kernel.length;
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let weightSum = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelX = x + kx - halfKernel;
            const pixelY = y + ky - halfKernel;

            if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
              const pixelIndex = (pixelY * width + pixelX) * 4;
              const weight = kernel[ky]?.[kx] ?? 0;

              r += data[pixelIndex]! * weight;
              g += data[pixelIndex + 1]! * weight;
              b += data[pixelIndex + 2]! * weight;
              a += data[pixelIndex + 3]! * weight;
              weightSum += weight;
            }
          }
        }

        const outputIndex = (y * width + x) * 4;
        blurred.data[outputIndex] = r / weightSum;
        blurred.data[outputIndex + 1] = g / weightSum;
        blurred.data[outputIndex + 2] = b / weightSum;
        blurred.data[outputIndex + 3] = a / weightSum;
      }
    }

    return blurred;
  }, [createGaussianKernel]);

  const analyzeBrightness = useCallback(async (
    imageData: ImageData,
    settings: ContourSettings
  ): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      // キャッシュキーを生成（画像のハッシュ + ブラー値）
      const imageHash = generateImageHash(imageData);
      const cacheKey = `${imageHash}-${settings.gaussianBlur}`;
      
      // キャッシュから取得を試行
      let processedImageData = blurCacheRef.current.get(cacheKey);
      
      if (!processedImageData) {
        // キャッシュにない場合のみ処理を実行
        processedImageData = applyGaussianBlur(imageData, settings.gaussianBlur);
        
        // キャッシュサイズ制限（最大5個まで保持）
        if (blurCacheRef.current.size >= 5) {
          const firstKey = blurCacheRef.current.keys().next().value as string;
          blurCacheRef.current.delete(firstKey);
        }
        
        blurCacheRef.current.set(cacheKey, processedImageData);
      }
      
      const { width, height, data } = processedImageData;
      const brightnessMap: number[][] = [];

      for (let y = 0; y < height; y++) {
        brightnessMap[y] = [];
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          
          const brightness = calculateBrightness(data[index]!, data[index + 1]!, data[index + 2]!);
          brightnessMap[y]![x] = brightness;
        }
      }

      setBrightnessData({
        imageData: processedImageData,
        brightnessMap,
        width,
        height,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Brightness analysis failed.');
    } finally {
      setIsProcessing(false);
    }
  }, [applyGaussianBlur]);

  // 画像の簡易ハッシュ生成（サンプリングベース）
  const generateImageHash = (imageData: ImageData): string => {
    const { data, width, height } = imageData;
    let hash = '';
    
    // 画像の四隅と中央の数ピクセルをサンプリング
    const samplePoints = [
      [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
      [Math.floor(width / 2), Math.floor(height / 2)]
    ];
    
    for (const point of samplePoints) {
      const x = point[0]!;
      const y = point[1]!;
      const index = (y * width + x) * 4;
      hash += `${data[index]!}-${data[index + 1]!}-${data[index + 2]!}-`;
    }
    
    return hash + `${width}x${height}`;
  };

  const clearAnalysis = useCallback(() => {
    setBrightnessData(null);
    setError(null);
    // キャッシュもクリア
    blurCacheRef.current.clear();
  }, []);

  return {
    brightnessData,
    isProcessing,
    error,
    analyzeBrightness,
    clearAnalysis,
  };
};