import { useState, useCallback, useRef, useEffect } from 'react';
import {
  NoiseReductionSettings,
  NoiseReductionResult,
  DEFAULT_NOISE_REDUCTION_SETTINGS
} from '../types/NoiseReductionTypes';
import { SettingsStorage } from './useLocalStorage';
import { openCVProcessor } from '../utils/OpenCVProcessor';

type CVMat = Parameters<Window['cv']['imshow']>[1];

// Mat を ImageData に変換するヘルパー
const matToImageData = (mat: CVMat): ImageData => {
  const canvas = document.createElement('canvas');
  canvas.width = mat.cols;
  canvas.height = mat.rows;
  window.cv.imshow(canvas, mat);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get canvas 2D context');
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

export const useNoiseReduction = () => {
  const [settings, setSettings] = useState<NoiseReductionSettings>(() =>
    SettingsStorage.getNoiseReductionSettings(DEFAULT_NOISE_REDUCTION_SETTINGS)
  );
  const [result, setResult] = useState<NoiseReductionResult>({
    denoisedImageData: null,
    processing: false,
    error: null,
    processingTime: 0
  });
  const [openCVLoaded, setOpenCVLoaded] = useState(false);
  const [openCVLoading, setOpenCVLoading] = useState(true);
  const [openCVError, setOpenCVError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // OpenCV.jsの読み込み完了を待つ
  useEffect(() => {
    const checkOpenCVStatus = async () => {
      setOpenCVLoading(true);
      setOpenCVError(null);
      try {
        await openCVProcessor.ensureLoaded();
        setOpenCVLoaded(true);
      } catch (err) {
        console.warn('OpenCV.js loading failed:', err);
        setOpenCVLoaded(false);
        setOpenCVError(err instanceof Error ? err.message : 'OpenCV.js failed to load');
      } finally {
        setOpenCVLoading(false);
      }
    };

    checkOpenCVStatus();
  }, []);

  const processImage = useCallback(async (imageData: ImageData | null = null) => {
    if (!imageData) return;

    if (!openCVLoaded) {
      setResult(prev => ({
        ...prev,
        error: 'OpenCV.js is not loaded or not ready',
        processing: false
      }));
      return;
    }

    const cv = window.cv;
    // bilateralFilter / split / merge はビルドによっては含まれないため実行前に確認
    for (const fn of ['bilateralFilter', 'split', 'merge', 'cvtColor', 'matFromImageData', 'imshow'] as const) {
      if (typeof cv[fn] !== 'function') {
        setResult(prev => ({
          ...prev,
          error: `OpenCV ${fn} function not available`,
          processing: false
        }));
        return;
      }
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

      const mats: { delete(): void }[] = [];
      const track = <T extends { delete(): void }>(mat: T): T => {
        mats.push(mat);
        return mat;
      };

      try {
        // RGBA → RGB → YCrCb に変換し、輝度と色を分離
        const src = track(cv.matFromImageData(imageData));
        const rgb = track(new cv.Mat());
        cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
        const ycc = track(new cv.Mat());
        cv.cvtColor(rgb, ycc, cv.COLOR_RGB2YCrCb);

        const channels = track(new cv.MatVector());
        cv.split(ycc, channels);

        // バイラテラルフィルタのパラメータ
        const d = settings.radius * 2 + 1;
        const sigmaSpace = Math.max(1, settings.radius * 2);
        const luminanceSigma = (settings.luminanceStrength / 100) * 60;
        const colorSigma = (settings.colorStrength / 100) * 100;

        // 強度0のチャンネルはフィルタをスキップしてそのまま使う
        const denoiseChannel = (channel: ReturnType<typeof channels.get>, sigmaColor: number) => {
          if (sigmaColor <= 0) return channel;
          const dst = track(new cv.Mat());
          cv.bilateralFilter(channel, dst, d, sigmaColor, sigmaSpace);
          return dst;
        };

        const y = track(channels.get(0));
        const cr = track(channels.get(1));
        const cb = track(channels.get(2));

        const merged = track(new cv.MatVector());
        merged.push_back(denoiseChannel(y, luminanceSigma));
        merged.push_back(denoiseChannel(cr, colorSigma));
        merged.push_back(denoiseChannel(cb, colorSigma));

        const yccDenoised = track(new cv.Mat());
        cv.merge(merged, yccDenoised);
        const rgbDenoised = track(new cv.Mat());
        cv.cvtColor(yccDenoised, rgbDenoised, cv.COLOR_YCrCb2RGB);
        const rgbaDenoised = track(new cv.Mat());
        cv.cvtColor(rgbDenoised, rgbaDenoised, cv.COLOR_RGB2RGBA);

        const denoised = matToImageData(rgbaDenoised);

        // Detail: 元画像の高周波成分（original - blur(original)）をブレンドバックして
        // 筆致などの微細テクスチャを復元する
        const detailAmount = settings.detail / 100;
        if (detailAmount > 0) {
          const blurred = track(new cv.Mat());
          cv.GaussianBlur(src, blurred, new cv.Size(5, 5), 1.5, 1.5);
          const blurredData = matToImageData(blurred);

          const orig = imageData.data;
          const blur = blurredData.data;
          const out = denoised.data;
          for (let i = 0; i < out.length; i += 4) {
            for (let c = 0; c < 3; c++) {
              out[i + c] = out[i + c]! + (orig[i + c]! - blur[i + c]!) * detailAmount;
            }
            out[i + 3] = orig[i + 3]!;
          }
        }

        const processingTime = performance.now() - startTime;

        if (!abortControllerRef.current?.signal.aborted) {
          setResult({
            denoisedImageData: denoised,
            processing: false,
            error: null,
            processingTime
          });
        }
      } finally {
        for (const mat of mats) {
          mat.delete();
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
  }, [settings, openCVLoaded]);

  const updateSettings = useCallback((newSettings: Partial<NoiseReductionSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      SettingsStorage.saveNoiseReductionSettings(updated);
      return updated;
    });
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
    openCVLoaded,
    openCVLoading,
    openCVError,
    processImage,
    updateSettings,
    clearResult
  };
};
