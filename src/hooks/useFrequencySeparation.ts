import { useState, useCallback, useRef } from 'react';
import { FrequencyData, FrequencySettings } from '../types/FrequencyTypes';


export const useFrequencySeparation = () => {
  const [frequencyData, setFrequencyData] = useState<FrequencyData>({
    lowFrequency: null,
    highFrequencyBright: null,
    highFrequencyDark: null,
    highFrequencyCombined: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const createGaussianKernel = useCallback((radius: number): number[] => {
    const size = Math.ceil(radius * 2) * 2 + 1;
    const kernel: number[] = [];
    const sigma = radius / 3;
    const twoSigmaSquared = 2 * sigma * sigma;
    let sum = 0;

    const center = Math.floor(size / 2);
    for (let i = 0; i < size; i++) {
      const distance = i - center;
      const value = Math.exp(-(distance * distance) / twoSigmaSquared);
      kernel[i] = value;
      sum += value;
    }

    // Normalize
    for (let i = 0; i < size; i++) {
      if (kernel[i] !== undefined) {
        kernel[i] = kernel[i]! / sum;
      }
    }

    return kernel;
  }, []);

  // Convert radius to kernel size (same as Image Filter)
  const radiusToKernelSize = useCallback((radius: number): number => {
    const kernelSize = Math.ceil(radius * 2) * 2 + 1;
    return Math.max(3, Math.min(201, kernelSize)); // Same limits as Image Filter
  }, []);

  const applyMedianFilter = useCallback(async (imageData: ImageData, radius: number): Promise<ImageData> => {
    // OpenCV.js availability check
    if (!window.cv || typeof window.cv.Mat !== 'function') {
      throw new Error('OpenCV.js is not loaded or not ready');
    }

    if (typeof window.cv.medianBlur !== 'function') {
      throw new Error('OpenCV medianBlur function not available');
    }

    console.log(`OpenCV median filter: radius=${radius}, image=${imageData.width}x${imageData.height}`);

    let src: OpenCVMat | null = null;
    let dst: OpenCVMat | null = null;

    try {
      // Convert ImageData to OpenCV Mat
      src = window.cv.matFromImageData(imageData);
      dst = new window.cv.Mat();

      // Calculate kernel size (same logic as Image Filter)
      const kernelSize = radiusToKernelSize(radius);

      // Apply OpenCV median filter
      window.cv.medianBlur(src, dst, kernelSize);

      // Convert back to ImageData
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;

      window.cv.imshow(canvas, dst);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Unable to get canvas 2D context');
      }

      const resultImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      return resultImageData;
    } catch (error) {
      throw new Error(`OpenCV median filter failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up OpenCV Mat objects
      if (src && typeof src.delete === 'function') {
        src.delete();
      }
      if (dst && typeof dst.delete === 'function') {
        dst.delete();
      }
    }
  }, [radiusToKernelSize]);

  const applyGaussianBlur = useCallback((imageData: ImageData, radius: number): ImageData => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      canvasRef.current = document.createElement('canvas');
    };
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const kernel = createGaussianKernel(radius);
    const kernelSize = kernel.length;
    const kernelRadius = Math.floor(kernelSize / 2);

    const source = new Uint8ClampedArray(imageData.data);
    const temp = new Uint8ClampedArray(imageData.data.length);
    const result = new Uint8ClampedArray(imageData.data.length);

    const { width, height } = imageData;

    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;

        for (let i = 0; i < kernelSize; i++) {
          const sampleX = Math.min(Math.max(x + i - kernelRadius, 0), width - 1);
          const sourceIndex = (y * width + sampleX) * 4;
          const weight = kernel[i] || 0;

          r += (source[sourceIndex] || 0) * weight;
          g += (source[sourceIndex + 1] || 0) * weight;
          b += (source[sourceIndex + 2] || 0) * weight;
          a += (source[sourceIndex + 3] || 0) * weight;
        }

        const targetIndex = (y * width + x) * 4;
        temp[targetIndex] = r;
        temp[targetIndex + 1] = g;
        temp[targetIndex + 2] = b;
        temp[targetIndex + 3] = a;
      }
    }

    // Vertical pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;

        for (let i = 0; i < kernelSize; i++) {
          const sampleY = Math.min(Math.max(y + i - kernelRadius, 0), height - 1);
          const sourceIndex = (sampleY * width + x) * 4;
          const weight = kernel[i] || 0;

          r += (temp[sourceIndex] || 0) * weight;
          g += (temp[sourceIndex + 1] || 0) * weight;
          b += (temp[sourceIndex + 2] || 0) * weight;
          a += (temp[sourceIndex + 3] || 0) * weight;
        }

        const targetIndex = (y * width + x) * 4;
        result[targetIndex] = r;
        result[targetIndex + 1] = g;
        result[targetIndex + 2] = b;
        result[targetIndex + 3] = a;
      }
    }

    return new ImageData(result, width, height);
  }, [createGaussianKernel]);

  const separateFrequencies = useCallback(async (
    imageData: ImageData,
    settings: FrequencySettings
  ): Promise<FrequencyData> => {

    // Apply selected filter to get low frequency component
    const lowFrequency = settings.filterMethod === 'gaussian'
      ? applyGaussianBlur(imageData, settings.blurRadius)
      : await applyMedianFilter(imageData, settings.blurRadius);

    const { width, height } = imageData;
    const original = imageData.data;
    const lowFreq = lowFrequency.data;

    // Create high frequency components
    const highFreqBrightData = new Uint8ClampedArray(original.length);
    const highFreqDarkData = new Uint8ClampedArray(original.length);
    const highFreqCombinedData = new Uint8ClampedArray(original.length);

    for (let i = 0; i < original.length; i += 4) {
      // Calculate high frequency difference
      const rDiff = (original[i] || 0) - (lowFreq[i] || 0);
      const gDiff = (original[i + 1] || 0) - (lowFreq[i + 1] || 0);
      const bDiff = (original[i + 2] || 0) - (lowFreq[i + 2] || 0);

      // Separate into bright and dark components
      const brightR = Math.max(0, rDiff);
      const brightG = Math.max(0, gDiff);
      const brightB = Math.max(0, bDiff);

      const darkR = Math.max(0, -rDiff);
      const darkG = Math.max(0, -gDiff);
      const darkB = Math.max(0, -bDiff);

      // Bright high frequency (Linear Light用: 128 + 明るい部分/2 * intensity)
      highFreqBrightData[i] = Math.round(Math.min(255, 128 + brightR * settings.brightIntensity / 2));
      highFreqBrightData[i + 1] = Math.round(Math.min(255, 128 + brightG * settings.brightIntensity / 2));
      highFreqBrightData[i + 2] = Math.round(Math.min(255, 128 + brightB * settings.brightIntensity / 2));
      highFreqBrightData[i + 3] = original[i + 3] || 255;

      // Dark high frequency (Linear Light用: 128 - 暗い部分/2 * intensity)
      highFreqDarkData[i] = Math.round(Math.max(0, 128 - darkR * settings.darkIntensity / 2));
      highFreqDarkData[i + 1] = Math.round(Math.max(0, 128 - darkG * settings.darkIntensity / 2));
      highFreqDarkData[i + 2] = Math.round(Math.max(0, 128 - darkB * settings.darkIntensity / 2));
      highFreqDarkData[i + 3] = original[i + 3] || 255;

      // Combined high frequency (Linear Light合成用: 128 + diff/2)
      // Linear Light: Base + 2*(Overlay-128) = Low + 2*(128+diff/2-128) = Low + diff = Original
      const combinedR = Math.max(0, Math.min(255, 128 + rDiff / 2));
      const combinedG = Math.max(0, Math.min(255, 128 + gDiff / 2));
      const combinedB = Math.max(0, Math.min(255, 128 + bDiff / 2));

      highFreqCombinedData[i] = Math.round(combinedR);
      highFreqCombinedData[i + 1] = Math.round(combinedG);
      highFreqCombinedData[i + 2] = Math.round(combinedB);
      highFreqCombinedData[i + 3] = original[i + 3] || 255;
    }

    return {
      lowFrequency,
      highFrequencyBright: new ImageData(highFreqBrightData, width, height),
      highFrequencyDark: new ImageData(highFreqDarkData, width, height),
      highFrequencyCombined: new ImageData(highFreqCombinedData, width, height),
    };
  }, [applyGaussianBlur, applyMedianFilter]);

  const processFrequencySeparation = useCallback(async (
    imageData: ImageData,
    settings: FrequencySettings
  ) => {
    setIsProcessing(true);

    try {
      // Short delay to ensure UI update
      await new Promise(resolve => setTimeout(resolve, 50));

      // Call async separateFrequencies directly
      const result = await separateFrequencies(imageData, settings);

      setFrequencyData(result);
    } catch (error) {
      console.error('Frequency separation processing failed:', error);
      setFrequencyData({
        lowFrequency: null,
        highFrequencyBright: null,
        highFrequencyDark: null,
        highFrequencyCombined: null,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [separateFrequencies]);

  return {
    frequencyData,
    isProcessing,
    processFrequencySeparation,
  };
};