export interface BrightnessData {
  imageData: ImageData;
  brightnessMap: number[][];
  levels: number[];
  width: number;
  height: number;
}

export interface ContourSettings {
  levels: number;
  transparency: number;
  minContourDistance?: number;
  brightnessThreshold?: number; // 明暗切り替えの閾値 (0-255)
  contourContrast?: number; // 等高線のコントラスト調整 (0-100)
}

export interface ImageUploadResult {
  file: File;
  image: HTMLImageElement;
  originalImageData: ImageData;
  width: number;
  height: number;
}

export const MAX_IMAGE_SIZE = 8000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const DEFAULT_CONTOUR_LEVELS = 4;
export const MIN_CONTOUR_LEVELS = 1;
export const MAX_CONTOUR_LEVELS = 64;