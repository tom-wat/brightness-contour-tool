import { useState, useCallback } from 'react';
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

  const calculateBrightness = (r: number, g: number, b: number): number => {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  const analyzeBrightness = useCallback(async (
    imageData: ImageData,
    settings: ContourSettings
  ): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      // 直接元の画像データを使用（Gaussian Blurはnoise reductionに移行）
      const { width, height, data } = imageData;
      const brightnessMap: number[][] = [];

      for (let y = 0; y < height; y++) {
        brightnessMap[y] = [];
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const r = data[index] || 0;
          const g = data[index + 1] || 0;
          const b = data[index + 2] || 0;
          
          brightnessMap[y]![x] = calculateBrightness(r, g, b);
        }
      }

      // 輝度レベルを計算
      const levels = Array.from(
        { length: settings.levels },
        (_, i) => (i + 1) * (255 / (settings.levels + 1))
      );

      setBrightnessData({
        imageData,
        brightnessMap,
        levels,
        width,
        height
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setBrightnessData(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setBrightnessData(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    brightnessData,
    isProcessing,
    error,
    analyzeBrightness,
    clearAnalysis
  };
};