import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ImageFilterSettings,
  ImageFilterResult,
  DEFAULT_IMAGE_FILTER_SETTINGS
} from '../types/ImageFilterTypes';
import { SettingsStorage } from './useLocalStorage';

// OpenCV.js型定義のインポート（グローバル型を使用）
declare global {
  interface OpenCVMat {
    delete(): void;
    data: Uint8Array;
    cols: number;
    rows: number;
    clone(): OpenCVMat;
    channels(): number;
    copyTo(dst: OpenCVMat): void;
  }

  interface OpenCVPoint {
    x: number;
    y: number;
    delete(): void;
  }
}

export const useImageFilter = () => {
  // Load settings from localStorage on initialization
  const [settings, setSettings] = useState<ImageFilterSettings>(() => {
    return SettingsStorage.getImageFilterSettings(DEFAULT_IMAGE_FILTER_SETTINGS);
  });
  const [result, setResult] = useState<ImageFilterResult>({
    filteredImageData: null,
    processing: false,
    error: null,
    processingTime: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Convert radius to kernel size (always odd)
  const radiusToKernelSize = useCallback((radius: number): number => {
    const kernelSize = Math.ceil(radius * 2) * 2 + 1;
    return Math.max(3, Math.min(201, kernelSize)); // Clamp to valid range (max 201 for radius 100)
  }, []);

  const applyMedianFilter = useCallback((src: OpenCVMat, radius: number): OpenCVMat => {
    const dst = new window.cv.Mat();

    try {
      if (typeof window.cv.medianBlur !== 'function') {
        throw new Error('medianBlur function not available');
      }
      const kernelSize = radiusToKernelSize(radius);
      window.cv.medianBlur(src, dst, kernelSize);
    } catch (error) {
      dst.delete();
      throw error;
    }

    return dst;
  }, [radiusToKernelSize]);


  const applyGaussianFilter = useCallback((src: OpenCVMat, radius: number): OpenCVMat => {
    const dst = new window.cv.Mat();

    try {
      if (typeof window.cv.GaussianBlur !== 'function') {
        throw new Error('GaussianBlur function not available');
      }

      // Convert radius to kernel size and calculate sigma (same as Frequency Separation)
      const kernelSize = radiusToKernelSize(radius);
      const sigma = radius / 3; // Same calculation as Frequency Separation
      const validSigma = Math.max(0.1, Math.min(50.0, sigma));

      console.log(`Gaussian filter params: radius=${radius}, kernel=${kernelSize}, sigma=${validSigma}`);

      // 画像の形式をチェック
      if (!src || src.cols <= 0 || src.rows <= 0) {
        throw new Error('Invalid source image dimensions');
      }

      const ksize = new window.cv.Size(kernelSize, kernelSize);
      window.cv.GaussianBlur(src, dst, ksize, validSigma, validSigma);

      // 結果の検証
      if (dst.rows <= 0 || dst.cols <= 0) {
        throw new Error('Gaussian filter produced invalid output');
      }
    } catch (error) {
      dst.delete();
      throw error;
    }

    return dst;
  }, [radiusToKernelSize]);

  const processImage = useCallback(async (imageData: ImageData | null = null) => {
    if (!imageData) {
      console.log('Image filter processImage called with no image data');
      return;
    }
    
    console.log('Image filter processImage called:', { 
      enabled: settings.enabled, 
      method: settings.method,
      imageSize: `${imageData.width}x${imageData.height}`
    });

    // OpenCV.jsの読み込み確認
    if (!window.cv || typeof window.cv.Mat !== 'function') {
      setResult(prev => ({
        ...prev,
        error: 'OpenCV.js is not loaded or not ready',
        processing: false
      }));
      return;
    }

    // 基本的なOpenCV関数の可用性チェック
    if (typeof window.cv.matFromImageData !== 'function') {
      setResult(prev => ({
        ...prev,
        error: 'OpenCV matFromImageData function not available',
        processing: false
      }));
      return;
    }

    if (typeof window.cv.imshow !== 'function') {
      setResult(prev => ({
        ...prev,
        error: 'OpenCV imshow function not available',
        processing: false
      }));
      return;
    }

    if (!settings.enabled) {
      setResult({
        filteredImageData: null,
        processing: false,
        error: null,
        processingTime: 0
      });
      return;
    }

    // 入力データの検証
    if (!imageData || !imageData.data || imageData.width <= 0 || imageData.height <= 0) {
      setResult(prev => ({
        ...prev,
        error: 'Invalid image data',
        processing: false
      }));
      return;
    }

    // Cancel previous processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setResult(prev => ({
      ...prev,
      processing: true,
      error: null
    }));

    try {
      // Short delay to ensure UI update
      await new Promise(resolve => setTimeout(resolve, 50));

      const startTime = performance.now();

      // Create OpenCV Mat from ImageData
      let src: OpenCVMat | null = null;
      let processed: OpenCVMat | null = null;

      try {
        if (typeof window.cv.matFromImageData !== 'function') {
          throw new Error('matFromImageData function not available');
        }
        
        src = window.cv.matFromImageData(imageData);
        
        // Apply selected noise reduction method
        switch (settings.method) {
          case 'median':
            try {
              processed = applyMedianFilter(src, settings.medianParams.radius);
            } catch (error) {
              throw new Error(`Median filter failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            break;
          case 'gaussian':
            try {
              processed = applyGaussianFilter(
                src,
                settings.gaussianParams.radius
              );
            } catch (error) {
              throw new Error(`Gaussian filter failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            break;
          default:
            if (typeof src.clone === 'function') {
              processed = src.clone();
            } else {
              throw new Error('Unable to clone source matrix');
            }
        }

        // Convert back to ImageData
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        
        if (typeof window.cv.imshow !== 'function') {
          throw new Error('imshow function not available');
        }
        
        window.cv.imshow(canvas, processed);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Unable to get canvas 2D context');
        }
        
        const resultImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const processingTime = performance.now() - startTime;

        if (!abortControllerRef.current?.signal.aborted) {
          setResult({
            filteredImageData: resultImageData,
            processing: false,
            error: null,
            processingTime
          });
        }
      } finally {
        // メモリクリーンアップ - エラーが発生してもMatオブジェクトを削除
        if (src && typeof src.delete === 'function') {
          src.delete();
        }
        if (processed && typeof processed.delete === 'function') {
          processed.delete();
        }
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        setResult(prev => ({
          ...prev,
          processing: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }));
      }
    }
  }, [settings, applyMedianFilter, applyGaussianFilter]);

  const updateSettings = useCallback((newSettings: Partial<ImageFilterSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    // Save to localStorage
    SettingsStorage.saveImageFilterSettings(updatedSettings);
  }, [settings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_IMAGE_FILTER_SETTINGS);
    SettingsStorage.saveImageFilterSettings(DEFAULT_IMAGE_FILTER_SETTINGS);
  }, []);

  const clearResult = useCallback(() => {
    setResult({
      filteredImageData: null,
      processing: false,
      error: null,
      processingTime: 0
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    settings,
    result,
    processImage,
    updateSettings,
    resetSettings,
    clearResult
  };
};