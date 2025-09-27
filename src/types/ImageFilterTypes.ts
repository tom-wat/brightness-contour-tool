export type ImageFilterMethod = 
  | 'median'
  | 'gaussian';

export interface MedianFilterParams {
  radius: number; // 1-50 (radius in pixels)
}

export interface GaussianFilterParams {
  radius: number; // 1-100 (radius in pixels)
}

export interface ImageFilterSettings {
  method: ImageFilterMethod;
  enabled: boolean;
  opacity: number; // 0-1
  medianParams: MedianFilterParams;
  gaussianParams: GaussianFilterParams;
}

export interface ImageFilterResult {
  filteredImageData: ImageData | null;
  processing: boolean;
  error: string | null;
  processingTime: number;
}

export const DEFAULT_IMAGE_FILTER_SETTINGS: ImageFilterSettings = {
  method: 'gaussian',
  enabled: true,
  opacity: 1.0,
  medianParams: {
    radius: 2
  },
  gaussianParams: {
    radius: 2
  }
};