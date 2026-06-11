export interface DisplayLayers {
  original: boolean;
  filtered: boolean;
  denoised: boolean;
  contour: boolean;
  filteredContour: boolean;
  denoisedContour: boolean;
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
    denoised: false,
    contour: true,
    filteredContour: false,
    denoisedContour: false,
    lowFrequency: true,
    highFrequencyBright: true,
    highFrequencyDark: true,
    highFrequencyCombined: false,
  },
  grayscaleMode: false,
};
