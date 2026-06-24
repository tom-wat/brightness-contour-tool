export type ImageFilterMethod =
  | 'median'
  | 'gaussian'
  | 'bilateral'
  | 'guided';

export interface MedianFilterParams {
  radius: number; // 1-50 (radius in pixels)
}

export interface GaussianFilterParams {
  radius: number; // 1-100 (radius in pixels)
}

export interface BilateralFilterParams {
  radius: number; // 1-30 (spatial radius in pixels; diameter = radius*2+1)
  sigmaColor: number; // 1-150 (color/range sigma; larger = mixes more distant colors)
  sigmaSpace: number; // 1-100 (spatial sigma; larger = farther pixels influence each other)
}

export interface GuidedFilterParams {
  radius: number; // 1-50 (box window radius in pixels)
  strength: number; // 1-100 (mapped to regularization eps; larger = smoother)
}

export interface ImageFilterSettings {
  method: ImageFilterMethod;
  enabled: boolean;
  opacity: number; // 0-1
  medianParams: MedianFilterParams;
  gaussianParams: GaussianFilterParams;
  bilateralParams: BilateralFilterParams;
  guidedParams: GuidedFilterParams;
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
  },
  bilateralParams: {
    radius: 5,
    sigmaColor: 50,
    sigmaSpace: 10
  },
  guidedParams: {
    radius: 8,
    strength: 30
  }
};