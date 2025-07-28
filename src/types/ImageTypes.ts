export interface BrightnessData {
  imageData: ImageData;
  brightnessMap: number[][];
  width: number;
  height: number;
}

export interface ContourSettings {
  levels: number;
  lineThickness: number;
  transparency: number;
  gaussianBlur: number;
}

export interface ImageUploadResult {
  file: File;
  image: HTMLImageElement;
  originalImageData: ImageData;
  width: number;
  height: number;
}

export const MAX_IMAGE_SIZE = 4000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const DEFAULT_CONTOUR_LEVELS = 4;
export const MIN_CONTOUR_LEVELS = 1;
export const MAX_CONTOUR_LEVELS = 64;