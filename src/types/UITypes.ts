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