import { useState, useCallback, useRef, useEffect } from 'react';
import {
  NoiseReductionSettings,
  NoiseReductionResult,
  DEFAULT_NOISE_REDUCTION_SETTINGS
} from '../types/NoiseReductionTypes';

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

export const useNoiseReduction = () => {
  const [settings, setSettings] = useState<NoiseReductionSettings>(DEFAULT_NOISE_REDUCTION_SETTINGS);
  const [result, setResult] = useState<NoiseReductionResult>({
    denoisedImageData: null,
    processing: false,
    error: null,
    processingTime: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const applyMedianFilter = useCallback((src: OpenCVMat, kernelSize: number): OpenCVMat => {
    const dst = new window.cv.Mat();
    
    try {
      if (typeof window.cv.medianBlur !== 'function') {
        throw new Error('medianBlur function not available');
      }
      window.cv.medianBlur(src, dst, kernelSize);
    } catch (error) {
      dst.delete();
      throw error;
    }
    
    return dst;
  }, []);

  const applyBilateralFilter = useCallback((src: OpenCVMat, d: number, sigmaColor: number, sigmaSpace: number): OpenCVMat => {
    const dst = new window.cv.Mat();
    
    try {
      if (typeof window.cv.bilateralFilter !== 'function') {
        throw new Error('bilateralFilter function not available');
      }

      // パラメータ検証と調整
      const validD = Math.max(3, Math.min(25, d)); // 3-25の範囲に制限
      const validSigmaColor = Math.max(10, Math.min(200, sigmaColor)); // 10-200の範囲に制限
      const validSigmaSpace = Math.max(10, Math.min(200, sigmaSpace)); // 10-200の範囲に制限

      // dは奇数である必要がある場合が多い
      const oddD = validD % 2 === 0 ? validD + 1 : validD;

      console.log(`Bilateral filter params: d=${oddD}, sigmaColor=${validSigmaColor}, sigmaSpace=${validSigmaSpace}`);

      // 画像の形式をチェック
      if (!src || src.cols <= 0 || src.rows <= 0) {
        throw new Error('Invalid source image dimensions');
      }

      const channels = src.channels();
      console.log(`Source image: ${src.cols}x${src.rows}, channels: ${channels}`);

      // グレースケール画像の場合、RGBAに変換
      let processingSrc = src;
      let needsCleanup = false;

      if (channels === 1) {
        processingSrc = new window.cv.Mat();
        window.cv.cvtColor(src, processingSrc, window.cv.COLOR_GRAY2RGBA);
        needsCleanup = true;
      } else if (channels === 3) {
        // RGB画像をRGBAに変換
        processingSrc = new window.cv.Mat();
        window.cv.cvtColor(src, processingSrc, window.cv.COLOR_RGB2RGBA);
        needsCleanup = true;
      }

      try {
        window.cv.bilateralFilter(processingSrc, dst, oddD, validSigmaColor, validSigmaSpace);
      } catch (bilateralError) {
        console.error('Bilateral filter error details:', bilateralError);
        
        // フォールバック: ガウシアンブラーを使用
        console.warn('Bilateral filter failed, falling back to Gaussian blur');
        if (typeof window.cv.GaussianBlur === 'function') {
          const kernelSize = Math.min(oddD, 15); // カーネルサイズを制限
          const sigma = validSigmaColor / 50; // sigmaを調整
          const ksize = new window.cv.Size(kernelSize, kernelSize);
          window.cv.GaussianBlur(processingSrc, dst, ksize, sigma, sigma);
        } else {
          // 最後のフォールバック: 元画像をコピー
          if (typeof processingSrc.copyTo === 'function') {
            processingSrc.copyTo(dst);
          } else {
            throw new Error('No fallback filter available');
          }
        }
      } finally {
        if (needsCleanup && processingSrc && typeof processingSrc.delete === 'function') {
          processingSrc.delete();
        }
      }
    } catch (error) {
      dst.delete();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Bilateral filter error: ${errorMessage}`);
    }
    
    return dst;
  }, []);

  const applyNLMeansDenoising = useCallback((src: OpenCVMat, h: number, templateWindowSize: number, searchWindowSize: number): OpenCVMat => {
    const dst = new window.cv.Mat();
    
    try {
      // グレースケール画像の場合
      if (src.channels() === 1) {
        let success = false;
        
        // 1. fastNlMeansDenoisingを試す
        if (typeof window.cv.fastNlMeansDenoising === 'function') {
          try {
            window.cv.fastNlMeansDenoising(src, dst, h, templateWindowSize, searchWindowSize);
            success = true;
          } catch (nlMeansError) {
            console.warn('fastNlMeansDenoising failed:', nlMeansError);
          }
        }
        
        // 2. Bilateral Filterで代替
        if (!success && typeof window.cv.bilateralFilter === 'function') {
          try {
            console.warn('NL-means not available, falling back to bilateral filter');
            const fallbackD = Math.min(Math.max(h * 2, 5), 25);
            const fallbackSigma = Math.min(Math.max(h * 5, 10), 150);
            const oddD = fallbackD % 2 === 0 ? fallbackD + 1 : fallbackD;
            
            window.cv.bilateralFilter(src, dst, oddD, fallbackSigma, fallbackSigma);
            success = true;
          } catch (bilateralError) {
            console.warn('bilateralFilter fallback failed:', bilateralError);
          }
        }
        
        // 3. Gaussian Blurで代替
        if (!success && typeof window.cv.GaussianBlur === 'function') {
          try {
            console.warn('Bilateral filter failed, falling back to Gaussian blur');
            const kernelSize = Math.min(Math.max(h, 3), 15);
            const oddKernel = kernelSize % 2 === 0 ? kernelSize + 1 : kernelSize;
            const sigma = h / 5;
            
            const ksize = new window.cv.Size(oddKernel, oddKernel);
            window.cv.GaussianBlur(src, dst, ksize, sigma, sigma);
            success = true;
          } catch (gaussianError) {
            console.warn('GaussianBlur fallback failed:', gaussianError);
          }
        }
        
        // 4. Median Filterで代替
        if (!success && typeof window.cv.medianBlur === 'function') {
          try {
            console.warn('Gaussian blur failed, falling back to median filter');
            const kernelSize = Math.min(Math.max(h, 3), 9);
            const oddKernel = kernelSize % 2 === 0 ? kernelSize + 1 : kernelSize;
            
            window.cv.medianBlur(src, dst, oddKernel);
            success = true;
          } catch (medianError) {
            console.warn('medianBlur fallback failed:', medianError);
          }
        }
        
        // 5. 最後のフォールバック: 元画像をコピー
        if (!success) {
          try {
            if (typeof src.copyTo === 'function') {
              src.copyTo(dst);
              success = true;
            } else {
              throw new Error('Unable to copy source image');
            }
          } catch (copyError) {
            console.error('Failed to copy source image:', copyError);
          }
        }
        
        if (!success) {
          throw new Error('All denoising methods failed for grayscale image');
        }
      } else {
        // カラー画像の場合 - 複数の関数名とフォールバックを試す
        let success = false;
        
        // 1. fastNlMeansDenoisingColored を試す
        if (typeof window.cv.fastNlMeansDenoisingColored === 'function') {
          try {
            window.cv.fastNlMeansDenoisingColored(src, dst, h, h, templateWindowSize, searchWindowSize);
            success = true;
          } catch (coloredError) {
            console.warn('fastNlMeansDenoisingColored failed:', coloredError);
          }
        }
        
        // 2. fastNlMeansDenoising を試す（カラー画像でも動作する場合がある）
        if (!success && typeof window.cv.fastNlMeansDenoising === 'function') {
          try {
            window.cv.fastNlMeansDenoising(src, dst, h, templateWindowSize, searchWindowSize);
            success = true;
          } catch (grayError) {
            console.warn('fastNlMeansDenoising failed on color image:', grayError);
          }
        }
        
        // 3. Bilateral Filterで代替
        if (!success && typeof window.cv.bilateralFilter === 'function') {
          try {
            console.warn('NL-means not available, falling back to bilateral filter');
            const fallbackD = Math.min(Math.max(h * 2, 5), 25); // 5-25の範囲
            const fallbackSigma = Math.min(Math.max(h * 5, 10), 150); // 10-150の範囲
            
            // dを奇数に調整
            const oddD = fallbackD % 2 === 0 ? fallbackD + 1 : fallbackD;
            
            window.cv.bilateralFilter(src, dst, oddD, fallbackSigma, fallbackSigma);
            success = true;
          } catch (bilateralError) {
            console.warn('bilateralFilter fallback failed:', bilateralError);
          }
        }
        
        // 4. Gaussian Blurで代替
        if (!success && typeof window.cv.GaussianBlur === 'function') {
          try {
            console.warn('Bilateral filter also failed, falling back to Gaussian blur');
            const kernelSize = Math.min(Math.max(h, 3), 15); // 3-15の範囲
            const oddKernel = kernelSize % 2 === 0 ? kernelSize + 1 : kernelSize;
            const sigma = h / 5; // sigmaを調整
            
            const ksize = new window.cv.Size(oddKernel, oddKernel);
            window.cv.GaussianBlur(src, dst, ksize, sigma, sigma);
            success = true;
          } catch (gaussianError) {
            console.warn('GaussianBlur fallback failed:', gaussianError);
          }
        }
        
        // 5. Median Filterで代替
        if (!success && typeof window.cv.medianBlur === 'function') {
          try {
            console.warn('Gaussian blur also failed, falling back to median filter');
            const kernelSize = Math.min(Math.max(h, 3), 9); // 3-9の範囲
            const oddKernel = kernelSize % 2 === 0 ? kernelSize + 1 : kernelSize;
            
            window.cv.medianBlur(src, dst, oddKernel);
            success = true;
          } catch (medianError) {
            console.warn('medianBlur fallback failed:', medianError);
          }
        }
        
        // 6. 最後のフォールバック: 元画像をコピー
        if (!success) {
          try {
            console.warn('All filters failed, copying original image');
            if (typeof src.copyTo === 'function') {
              src.copyTo(dst);
              success = true;
            } else {
              throw new Error('Unable to copy source image');
            }
          } catch (copyError) {
            console.error('Failed to copy source image:', copyError);
          }
        }
        
        if (!success) {
          throw new Error('All noise reduction methods failed, including fallbacks');
        }
      }
    } catch (error) {
      dst.delete();
      throw error;
    }
    
    return dst;
  }, []);

  const applyMorphologyFilter = useCallback((src: OpenCVMat, operation: string, kernelShape: string, kernelSize: number, iterations: number): OpenCVMat => {
    const dst = new window.cv.Mat();
    let kernel: OpenCVMat | null = null;
    let anchor: OpenCVPoint | null = null;
    
    try {
      // 必要な関数の可用性チェック
      if (typeof window.cv.getStructuringElement !== 'function' || 
          typeof window.cv.morphologyEx !== 'function' ||
          typeof window.cv.Point !== 'function') {
        throw new Error('Required morphology functions not available');
      }

      // Create morphological kernel
      let morphShape: number;
      switch (kernelShape) {
        case 'rect':
          morphShape = window.cv.MORPH_RECT;
          break;
        case 'ellipse':
          morphShape = window.cv.MORPH_ELLIPSE;
          break;
        case 'cross':
          morphShape = window.cv.MORPH_CROSS;
          break;
        default:
          morphShape = window.cv.MORPH_ELLIPSE;
      }

      kernel = window.cv.getStructuringElement(
        morphShape,
        new window.cv.Size(kernelSize, kernelSize)
      );

      // Apply morphological operation
      let morphOp: number;
      switch (operation) {
        case 'opening':
          morphOp = window.cv.MORPH_OPEN;
          break;
        case 'closing':
          morphOp = window.cv.MORPH_CLOSE;
          break;
        case 'gradient':
          morphOp = window.cv.MORPH_GRADIENT;
          break;
        case 'tophat':
          morphOp = window.cv.MORPH_TOPHAT;
          break;
        case 'blackhat':
          morphOp = window.cv.MORPH_BLACKHAT;
          break;
        default:
          morphOp = window.cv.MORPH_OPEN;
      }

      anchor = new window.cv.Point(-1, -1);
      window.cv.morphologyEx(src, dst, morphOp, kernel, anchor, iterations, window.cv.BORDER_CONSTANT);
    } catch (error) {
      dst.delete();
      throw error;
    } finally {
      // メモリクリーンアップ
      if (anchor && typeof anchor.delete === 'function') {
        anchor.delete();
      }
      if (kernel && typeof kernel.delete === 'function') {
        kernel.delete();
      }
    }
    
    return dst;
  }, []);

  const processImage = useCallback(async (imageData: ImageData) => {
    console.log('Noise reduction processImage called:', { 
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

    if (!settings.enabled || settings.method === 'none') {
      setResult({
        denoisedImageData: null,
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
              processed = applyMedianFilter(src, settings.medianParams.kernelSize);
            } catch (error) {
              throw new Error(`Median filter failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            break;
          case 'bilateral':
            try {
              processed = applyBilateralFilter(
                src,
                settings.bilateralParams.d,
                settings.bilateralParams.sigmaColor,
                settings.bilateralParams.sigmaSpace
              );
            } catch (error) {
              throw new Error(`Bilateral filter failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            break;
          case 'nlmeans':
            try {
              processed = applyNLMeansDenoising(
                src,
                settings.nlmeansParams.h,
                settings.nlmeansParams.templateWindowSize,
                settings.nlmeansParams.searchWindowSize
              );
            } catch (error) {
              throw new Error(`NL-means denoising failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            break;
          case 'morphology':
            try {
              processed = applyMorphologyFilter(
                src,
                settings.morphologyParams.operation,
                settings.morphologyParams.kernelShape,
                settings.morphologyParams.kernelSize,
                settings.morphologyParams.iterations
              );
            } catch (error) {
              throw new Error(`Morphology filter failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            denoisedImageData: resultImageData,
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
  }, [settings, applyMedianFilter, applyBilateralFilter, applyNLMeansDenoising, applyMorphologyFilter]);

  const updateSettings = useCallback((newSettings: Partial<NoiseReductionSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_NOISE_REDUCTION_SETTINGS);
  }, []);

  const clearResult = useCallback(() => {
    setResult({
      denoisedImageData: null,
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