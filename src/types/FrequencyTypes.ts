export interface FrequencyData {
  lowFrequency: ImageData | null;
  highFrequencyBright: ImageData | null;
  highFrequencyDark: ImageData | null;
  highFrequencyCombined: ImageData | null;
}

export interface FrequencySettings {
  blurRadius: number;
  brightIntensity: number;
  darkIntensity: number;
}

export interface FrequencyPreset {
  name: string;
  settings: FrequencySettings;
}

export const DEFAULT_FREQUENCY_SETTINGS: FrequencySettings = {
  blurRadius: 5,
  brightIntensity: 1.0,
  darkIntensity: 1.0,
};

export const FREQUENCY_PRESETS: FrequencyPreset[] = [
  {
    name: 'Portrait',
    settings: {
      blurRadius: 15,
      brightIntensity: 0.8,
      darkIntensity: 1.2,
    },
  },
  {
    name: 'Landscape',
    settings: {
      blurRadius: 8,
      brightIntensity: 1.3,
      darkIntensity: 1.1,
    },
  },
  {
    name: 'Industrial',
    settings: {
      blurRadius: 5,
      brightIntensity: 2.0,
      darkIntensity: 2.0,
    },
  },
];