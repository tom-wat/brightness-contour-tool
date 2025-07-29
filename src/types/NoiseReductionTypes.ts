export type NoiseReductionMethod = 
  | 'none'
  | 'median'
  | 'bilateral'
  | 'nlmeans'
  | 'morphology';

export interface MedianFilterParams {
  kernelSize: number; // 3, 5, 7, 9
}

export interface BilateralFilterParams {
  d: number; // Diameter of pixel neighborhood (5-25)
  sigmaColor: number; // Filter sigma in color space (10-150)
  sigmaSpace: number; // Filter sigma in coordinate space (10-150)
}

export interface NLMeansParams {
  h: number; // Filter strength (3-20)
  templateWindowSize: number; // Template patch size (7, 21)
  searchWindowSize: number; // Search window size (21, 35)
}

export interface MorphologyFilterParams {
  operation: 'opening' | 'closing' | 'gradient' | 'tophat' | 'blackhat';
  kernelShape: 'rect' | 'ellipse' | 'cross';
  kernelSize: number; // 3, 5, 7, 9
  iterations: number; // 1-5
}

export interface NoiseReductionSettings {
  method: NoiseReductionMethod;
  enabled: boolean;
  opacity: number; // 0-1
  medianParams: MedianFilterParams;
  bilateralParams: BilateralFilterParams;
  nlmeansParams: NLMeansParams;
  morphologyParams: MorphologyFilterParams;
}

export interface NoiseReductionPreset {
  name: string;
  description: string;
  settings: NoiseReductionSettings;
}

export interface NoiseReductionResult {
  denoisedImageData: ImageData | null;
  processing: boolean;
  error: string | null;
  processingTime: number;
}

export const DEFAULT_NOISE_REDUCTION_SETTINGS: NoiseReductionSettings = {
  method: 'none',
  enabled: false,
  opacity: 1.0,
  medianParams: {
    kernelSize: 5
  },
  bilateralParams: {
    d: 9,
    sigmaColor: 75,
    sigmaSpace: 75
  },
  nlmeansParams: {
    h: 10,
    templateWindowSize: 7,
    searchWindowSize: 21
  },
  morphologyParams: {
    operation: 'opening',
    kernelShape: 'ellipse',
    kernelSize: 5,
    iterations: 1
  }
};

export const NOISE_REDUCTION_PRESETS: NoiseReductionPreset[] = [
  {
    name: 'Photo (Light)',
    description: 'Light noise reduction for portraits and landscapes',
    settings: {
      ...DEFAULT_NOISE_REDUCTION_SETTINGS,
      method: 'bilateral',
      enabled: true,
      bilateralParams: {
        d: 5,
        sigmaColor: 50,
        sigmaSpace: 50
      }
    }
  },
  {
    name: 'Photo (Strong)',
    description: 'Strong noise reduction for high ISO photography',
    settings: {
      ...DEFAULT_NOISE_REDUCTION_SETTINGS,
      method: 'bilateral', // NL-meansの代わりにbilateralを使用
      enabled: true,
      bilateralParams: {
        d: 9,
        sigmaColor: 100,
        sigmaSpace: 100
      }
    }
  },
  {
    name: 'Illustration',
    description: 'Salt and pepper noise removal for scanned artwork',
    settings: {
      ...DEFAULT_NOISE_REDUCTION_SETTINGS,
      method: 'median',
      enabled: true,
      medianParams: {
        kernelSize: 3
      }
    }
  },
  {
    name: 'Medical',
    description: 'Noise reduction for X-ray and MRI medical images',
    settings: {
      ...DEFAULT_NOISE_REDUCTION_SETTINGS,
      method: 'morphology',
      enabled: true,
      morphologyParams: {
        operation: 'opening',
        kernelShape: 'ellipse',
        kernelSize: 3,
        iterations: 2
      }
    }
  }
];