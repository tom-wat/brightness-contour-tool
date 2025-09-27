export enum DisplayMode {
  COLOR_ONLY = 'COLOR_ONLY',
  GRAYSCALE_ONLY = 'GRAYSCALE_ONLY',
  CONTOUR_ONLY = 'CONTOUR_ONLY',
  COLOR_WITH_CONTOUR = 'COLOR_WITH_CONTOUR',
  GRAYSCALE_WITH_CONTOUR = 'GRAYSCALE_WITH_CONTOUR',
  // Noise Reduction Display Modes
  DENOISED_ONLY = 'DENOISED_ONLY',
  DENOISED_GRAYSCALE_ONLY = 'DENOISED_GRAYSCALE_ONLY',
  DENOISED_CONTOUR_ONLY = 'DENOISED_CONTOUR_ONLY',
  COLOR_WITH_DENOISED_CONTOUR = 'COLOR_WITH_DENOISED_CONTOUR',
  GRAYSCALE_WITH_DENOISED_CONTOUR = 'GRAYSCALE_WITH_DENOISED_CONTOUR',
}

export interface AppSettings {
  displayMode: DisplayMode;
  brightnessLayers: number;
  lineThickness: number;
  transparency: number;
  processingMode: 'fast' | 'precise' | 'auto';
}

export interface ProcessingStatus {
  isProcessing: boolean;
  currentOperation: string;
  progress: number;
  error?: string;
}

export interface DisplayLayers {
  original: boolean;
  filtered: boolean;
  contour: boolean;
  filteredContour: boolean;
  lowFrequency: boolean;
  highFrequencyBright: boolean;
  highFrequencyDark: boolean;
}

export interface DisplayOptions {
  layers: DisplayLayers;
  grayscaleMode: boolean;
}

export const DEFAULT_DISPLAY_OPTIONS: DisplayOptions = {
  layers: {
    original: true,
    filtered: false,
    contour: true,
    filteredContour: false,
    lowFrequency: true,
    highFrequencyBright: true,
    highFrequencyDark: true,
  },
  grayscaleMode: false,
};

export const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  [DisplayMode.COLOR_ONLY]: 'Original Image',
  [DisplayMode.GRAYSCALE_ONLY]: 'Grayscale',
  [DisplayMode.CONTOUR_ONLY]: 'Contours Only',
  [DisplayMode.COLOR_WITH_CONTOUR]: 'Original + Contours',
  [DisplayMode.GRAYSCALE_WITH_CONTOUR]: 'Grayscale + Contours',
  // Noise Reduction Display Modes
  [DisplayMode.DENOISED_ONLY]: 'Denoised Only',
  [DisplayMode.DENOISED_GRAYSCALE_ONLY]: 'Denoised Grayscale',
  [DisplayMode.DENOISED_CONTOUR_ONLY]: 'Denoised Contours Only',
  [DisplayMode.COLOR_WITH_DENOISED_CONTOUR]: 'Original + Denoised Contours',
  [DisplayMode.GRAYSCALE_WITH_DENOISED_CONTOUR]: 'Grayscale + Denoised Contours',
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  displayMode: DisplayMode.COLOR_WITH_CONTOUR,
  brightnessLayers: 4,
  lineThickness: 2,
  transparency: 80,
  processingMode: 'fast',
};