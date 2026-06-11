export interface DisplayLayers {
  original: boolean;
  filtered: boolean;
  contour: boolean;
  filteredContour: boolean;
  lowFrequency: boolean;
  highFrequencyBright: boolean;
  highFrequencyDark: boolean;
  highFrequencyCombined: boolean;
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
    highFrequencyCombined: false,
  },
  grayscaleMode: false,
};
