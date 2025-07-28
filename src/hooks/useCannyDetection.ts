import { useState, useCallback, useEffect } from 'react';
import { CannyParams, ThresholdPair, OtsuResult } from '../types/CannyTypes';
import { openCVProcessor } from '../utils/OpenCVProcessor';

interface UseCannyDetectionReturn {
  edgeData: ImageData | null;
  isProcessing: boolean;
  error: string | null;
  openCVLoaded: boolean;
  detectEdges: (imageData: ImageData, params: CannyParams) => Promise<void>;
  calculateOptimalThresholds: (imageData: ImageData) => ThresholdPair;
  clearEdges: () => void;
}

export const useCannyDetection = (): UseCannyDetectionReturn => {
  const [edgeData, setEdgeData] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCVLoaded, setOpenCVLoaded] = useState(false);

  // OpenCV.jsの読み込み状態を監視
  useEffect(() => {
    const checkOpenCVStatus = async () => {
      try {
        await openCVProcessor.ensureLoaded();
        setOpenCVLoaded(true);
      } catch (err) {
        console.warn('OpenCV.js loading failed:', err);
        setOpenCVLoaded(false);
      }
    };

    checkOpenCVStatus();
  }, []);


  const calculateHistogram = (imageData: ImageData): number[] => {
    const histogram = new Array(256).fill(0);
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
      const intensity = Math.round(0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!);
      histogram[intensity]!++;
    }

    return histogram;
  };

  const otsuMethod = (histogram: number[]): OtsuResult => {
    const total = histogram.reduce((sum, count) => sum + count, 0);
    let bestThreshold = 0;
    let bestVariance = 0;

    for (let t = 0; t < 256; t++) {
      let w0 = 0, w1 = 0;
      let sum0 = 0, sum1 = 0;

      for (let i = 0; i < 256; i++) {
        if (i <= t) {
          w0 += histogram[i]!;
          sum0 += i * histogram[i]!;
        } else {
          w1 += histogram[i]!;
          sum1 += i * histogram[i]!;
        }
      }

      if (w0 === 0 || w1 === 0) continue;

      const mean0 = sum0 / w0;
      const mean1 = sum1 / w1;
      const variance = (w0 / total) * (w1 / total) * Math.pow(mean0 - mean1, 2);

      if (variance > bestVariance) {
        bestVariance = variance;
        bestThreshold = t;
      }
    }

    return { threshold: bestThreshold, variance: bestVariance };
  };

  const calculateOptimalThresholds = useCallback((imageData: ImageData): ThresholdPair => {
    const histogram = calculateHistogram(imageData);
    const otsuResult = otsuMethod(histogram);

    return {
      lowThreshold: Math.round(otsuResult.threshold * 0.5),
      highThreshold: Math.round(otsuResult.threshold * 1.5),
    };
  }, []);

  const detectEdges = useCallback(async (
    imageData: ImageData,
    params: CannyParams
  ): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!openCVLoaded) {
        throw new Error('OpenCV.js is not loaded yet. Please wait and try again.');
      }

      // OpenCV.js版のみ使用（高精度）
      const edges = openCVProcessor.cannyEdgeDetection(
        imageData,
        params.lowThreshold,
        params.highThreshold,
        params.apertureSize || 3,
        params.L2gradient || false
      );

      setEdgeData(edges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Edge detection failed.');
    } finally {
      setIsProcessing(false);
    }
  }, [openCVLoaded]);

  const clearEdges = useCallback(() => {
    setEdgeData(null);
    setError(null);
  }, []);

  return {
    edgeData,
    isProcessing,
    error,
    openCVLoaded,
    detectEdges,
    calculateOptimalThresholds,
    clearEdges,
  };
};