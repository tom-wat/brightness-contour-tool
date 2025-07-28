import { useState, useCallback } from 'react';
import { CannyParams, ThresholdPair, OtsuResult } from '../types/CannyTypes';

interface UseCannyDetectionReturn {
  edgeData: ImageData | null;
  isProcessing: boolean;
  error: string | null;
  detectEdges: (imageData: ImageData, params: CannyParams) => Promise<void>;
  calculateOptimalThresholds: (imageData: ImageData) => ThresholdPair;
  clearEdges: () => void;
}

export const useCannyDetection = (): UseCannyDetectionReturn => {
  const [edgeData, setEdgeData] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gaussianBlur = (imageData: ImageData, sigma: number = 1.4): ImageData => {
    const { width, height, data } = imageData;
    const blurred = new ImageData(width, height);
    const kernel = createGaussianKernel(sigma);
    const kernelSize = kernel.length;
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weightSum = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelX = x + kx - halfKernel;
            const pixelY = y + ky - halfKernel;

            if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
              const pixelIndex = (pixelY * width + pixelX) * 4;
              const brightness = 0.299 * data[pixelIndex]! + 0.587 * data[pixelIndex + 1]! + 0.114 * data[pixelIndex + 2]!;
              const weight = kernel[ky]?.[kx] ?? 0;

              sum += brightness * weight;
              weightSum += weight;
            }
          }
        }

        const outputIndex = (y * width + x) * 4;
        const value = weightSum > 0 ? sum / weightSum : 0;
        blurred.data[outputIndex] = value;
        blurred.data[outputIndex + 1] = value;
        blurred.data[outputIndex + 2] = value;
        blurred.data[outputIndex + 3] = data[outputIndex + 3]!;
      }
    }

    return blurred;
  };

  const createGaussianKernel = (sigma: number): number[][] => {
    const size = Math.ceil(sigma * 3) * 2 + 1;
    const kernel: number[][] = [];
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
  };

  const calculateGradient = (imageData: ImageData): { magnitude: number[][]; direction: number[][] } => {
    const { width, height, data } = imageData;
    const magnitude: number[][] = [];
    const direction: number[][] = [];

    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 0; y < height; y++) {
      magnitude[y] = [];
      direction[y] = [];
      
      for (let x = 0; x < width; x++) {
        let gx = 0, gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelX = Math.max(0, Math.min(width - 1, x + kx));
            const pixelY = Math.max(0, Math.min(height - 1, y + ky));
            const pixelIndex = (pixelY * width + pixelX) * 4;
            const intensity = data[pixelIndex]!;

            gx += intensity * sobelX[ky + 1]![kx + 1]!;
            gy += intensity * sobelY[ky + 1]![kx + 1]!;
          }
        }

        magnitude[y]![x] = Math.sqrt(gx * gx + gy * gy);
        direction[y]![x] = Math.atan2(gy, gx);
      }
    }

    return { magnitude, direction };
  };

  const nonMaximumSuppression = (
    magnitude: number[][],
    direction: number[][]
  ): number[][] => {
    const height = magnitude.length;
    const width = magnitude[0]!.length;
    const suppressed: number[][] = [];

    for (let y = 0; y < height; y++) {
      suppressed[y] = [];
      for (let x = 0; x < width; x++) {
        const angle = direction[y]![x]! * (180 / Math.PI);
        const normalizedAngle = ((angle % 180) + 180) % 180;

        let neighbor1 = 0, neighbor2 = 0;

        if ((normalizedAngle >= 0 && normalizedAngle < 22.5) || (normalizedAngle >= 157.5 && normalizedAngle <= 180)) {
          neighbor1 = x > 0 ? magnitude[y]![x - 1]! : 0;
          neighbor2 = x < width - 1 ? magnitude[y]![x + 1]! : 0;
        } else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
          neighbor1 = (x > 0 && y > 0) ? magnitude[y - 1]![x - 1]! : 0;
          neighbor2 = (x < width - 1 && y < height - 1) ? magnitude[y + 1]![x + 1]! : 0;
        } else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
          neighbor1 = y > 0 ? magnitude[y - 1]![x]! : 0;
          neighbor2 = y < height - 1 ? magnitude[y + 1]![x]! : 0;
        } else {
          neighbor1 = (x < width - 1 && y > 0) ? magnitude[y - 1]![x + 1]! : 0;
          neighbor2 = (x > 0 && y < height - 1) ? magnitude[y + 1]![x - 1]! : 0;
        }

        const currentMagnitude = magnitude[y]![x]!;
        if (currentMagnitude >= neighbor1 && currentMagnitude >= neighbor2) {
          suppressed[y]![x] = currentMagnitude;
        } else {
          suppressed[y]![x] = 0;
        }
      }
    }

    return suppressed;
  };

  const hysteresisThresholding = (
    suppressed: number[][],
    lowThreshold: number,
    highThreshold: number
  ): ImageData => {
    const height = suppressed.length;
    const width = suppressed[0]!.length;
    const edges = new ImageData(width, height);
    const strong = 255;
    const weak = 75;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = suppressed[y]![x]!;
        const index = (y * width + x) * 4;

        if (pixel >= highThreshold) {
          edges.data[index] = strong;
          edges.data[index + 1] = strong;
          edges.data[index + 2] = strong;
          edges.data[index + 3] = 255;
        } else if (pixel >= lowThreshold) {
          edges.data[index] = weak;
          edges.data[index + 1] = weak;
          edges.data[index + 2] = weak;
          edges.data[index + 3] = 255;
        } else {
          edges.data[index] = 0;
          edges.data[index + 1] = 0;
          edges.data[index + 2] = 0;
          edges.data[index + 3] = 0;
        }
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = (y * width + x) * 4;
        if (edges.data[index] === weak) {
          let hasStrongNeighbor = false;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const neighborIndex = ((y + dy) * width + (x + dx)) * 4;
              if (edges.data[neighborIndex] === strong) {
                hasStrongNeighbor = true;
                break;
              }
            }
            if (hasStrongNeighbor) break;
          }

          if (hasStrongNeighbor) {
            edges.data[index] = strong;
            edges.data[index + 1] = strong;
            edges.data[index + 2] = strong;
          } else {
            edges.data[index] = 0;
            edges.data[index + 1] = 0;
            edges.data[index + 2] = 0;
            edges.data[index + 3] = 0;
          }
        }
      }
    }

    return edges;
  };

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
      const blurred = gaussianBlur(imageData);
      const { magnitude, direction } = calculateGradient(blurred);
      const suppressed = nonMaximumSuppression(magnitude, direction);
      const edges = hysteresisThresholding(suppressed, params.lowThreshold, params.highThreshold);

      setEdgeData(edges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Edge detection failed.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearEdges = useCallback(() => {
    setEdgeData(null);
    setError(null);
  }, []);

  return {
    edgeData,
    isProcessing,
    error,
    detectEdges,
    calculateOptimalThresholds,
    clearEdges,
  };
};