export enum DisplayMode {
  COLOR_ONLY = 'COLOR_ONLY',
  GRAYSCALE_ONLY = 'GRAYSCALE_ONLY',
  CONTOUR_ONLY = 'CONTOUR_ONLY',
  COLOR_WITH_CONTOUR = 'COLOR_WITH_CONTOUR',
  GRAYSCALE_WITH_CONTOUR = 'GRAYSCALE_WITH_CONTOUR',
  CANNY_EDGE_ONLY = 'CANNY_EDGE_ONLY',
  COLOR_WITH_CANNY = 'COLOR_WITH_CANNY',
  CONTOUR_WITH_CANNY = 'CONTOUR_WITH_CANNY',
  GRAYSCALE_WITH_CONTOUR_AND_CANNY = 'GRAYSCALE_WITH_CONTOUR_AND_CANNY',
  COLOR_WITH_CONTOUR_AND_CANNY = 'COLOR_WITH_CONTOUR_AND_CANNY',
  // Noise Reduction Display Modes
  DENOISED_ONLY = 'DENOISED_ONLY',
  DENOISED_GRAYSCALE_ONLY = 'DENOISED_GRAYSCALE_ONLY',
  DENOISED_CONTOUR_ONLY = 'DENOISED_CONTOUR_ONLY',
  COLOR_WITH_DENOISED_CONTOUR = 'COLOR_WITH_DENOISED_CONTOUR',
  GRAYSCALE_WITH_DENOISED_CONTOUR = 'GRAYSCALE_WITH_DENOISED_CONTOUR',
  DENOISED_WITH_CANNY = 'DENOISED_WITH_CANNY',
  ALL_WITH_DENOISING = 'ALL_WITH_DENOISING',
  ALL_WITH_DENOISING_GRAYSCALE = 'ALL_WITH_DENOISING_GRAYSCALE',
}

export interface AppSettings {
  displayMode: DisplayMode;
  brightnessLayers: number;
  lineThickness: number;
  transparency: number;
  cannyParams: import('./CannyTypes').CannyParams;
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
  edge: boolean;
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
    edge: false,
  },
  grayscaleMode: false,
};

export const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  [DisplayMode.COLOR_ONLY]: 'Original Image',
  [DisplayMode.GRAYSCALE_ONLY]: 'Grayscale',
  [DisplayMode.CONTOUR_ONLY]: 'Contours Only',
  [DisplayMode.COLOR_WITH_CONTOUR]: 'Original + Contours',
  [DisplayMode.GRAYSCALE_WITH_CONTOUR]: 'Grayscale + Contours',
  [DisplayMode.CANNY_EDGE_ONLY]: 'Canny Edges Only',
  [DisplayMode.COLOR_WITH_CANNY]: 'Original + Canny',
  [DisplayMode.CONTOUR_WITH_CANNY]: 'Contours + Canny',
  [DisplayMode.GRAYSCALE_WITH_CONTOUR_AND_CANNY]: 'Grayscale + Contours + Canny',
  [DisplayMode.COLOR_WITH_CONTOUR_AND_CANNY]: 'Combined View',
  // Noise Reduction Display Modes
  [DisplayMode.DENOISED_ONLY]: 'Denoised Only',
  [DisplayMode.DENOISED_GRAYSCALE_ONLY]: 'Denoised Grayscale',
  [DisplayMode.DENOISED_CONTOUR_ONLY]: 'Denoised Contours Only',
  [DisplayMode.COLOR_WITH_DENOISED_CONTOUR]: 'Original + Denoised Contours',
  [DisplayMode.GRAYSCALE_WITH_DENOISED_CONTOUR]: 'Grayscale + Denoised Contours',
  [DisplayMode.DENOISED_WITH_CANNY]: 'Denoised + Canny',
  [DisplayMode.ALL_WITH_DENOISING]: 'All Features + Denoising',
  [DisplayMode.ALL_WITH_DENOISING_GRAYSCALE]: 'All Features + Denoising (Grayscale)',
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  displayMode: DisplayMode.COLOR_WITH_CONTOUR,
  brightnessLayers: 4,
  lineThickness: 2,
  transparency: 80,
  cannyParams: {
    lowThreshold: 50,
    highThreshold: 150,
    apertureSize: 3,
    L2gradient: false,
  },
  processingMode: 'fast',
};