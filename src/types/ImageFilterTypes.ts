export type ImageFilterMethod = 
  | 'median'
  | 'gaussian';

export interface MedianFilterParams {
  kernelSize: number; // 3, 5, 7, 9
}

export interface GaussianFilterParams {
  kernelSize: number; // 3, 5, 7, 9
  sigmaX: number; // 0.5-3.0
  sigmaY: number; // 0.5-3.0
}

export interface ImageFilterSettings {
  method: ImageFilterMethod;
  enabled: boolean;
  opacity: number; // 0-1
  medianParams: MedianFilterParams;
  gaussianParams: GaussianFilterParams;
}

export interface ImageFilterPreset {
  name: string;
  description: string;
  settings: ImageFilterSettings;
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
    kernelSize: 5
  },
  gaussianParams: {
    kernelSize: 5,
    sigmaX: 1.5,
    sigmaY: 1.5
  }
};

export const IMAGE_FILTER_PRESETS: ImageFilterPreset[] = [
  {
    name: 'Light Smooth',
    description: 'Light smoothing with Gaussian blur',
    settings: {
      ...DEFAULT_IMAGE_FILTER_SETTINGS,
      method: 'gaussian',
      enabled: true,
      gaussianParams: {
        kernelSize: 5,
        sigmaX: 1.0,
        sigmaY: 1.0
      }
    }
  },
  {
    name: 'Strong Smooth',
    description: 'Strong smoothing for high noise images',
    settings: {
      ...DEFAULT_IMAGE_FILTER_SETTINGS,
      method: 'gaussian',
      enabled: true,
      gaussianParams: {
        kernelSize: 7,
        sigmaX: 2.0,
        sigmaY: 2.0
      }
    }
  },
  {
    name: 'Illustration',
    description: 'Salt and pepper noise removal for scanned artwork',
    settings: {
      ...DEFAULT_IMAGE_FILTER_SETTINGS,
      method: 'median',
      enabled: true,
      medianParams: {
        kernelSize: 3
      }
    }
  }
];