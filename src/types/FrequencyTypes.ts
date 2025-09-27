export type FrequencyFilterMethod = 'gaussian' | 'median';

export interface FrequencyData {
  lowFrequency: ImageData | null;
  highFrequencyBright: ImageData | null;
  highFrequencyDark: ImageData | null;
  highFrequencyCombined: ImageData | null;
}

export interface FrequencySettings {
  filterMethod: FrequencyFilterMethod;
  blurRadius: number;
  brightIntensity: number;
  darkIntensity: number;
}

export const DEFAULT_FREQUENCY_SETTINGS: FrequencySettings = {
  filterMethod: 'gaussian',
  blurRadius: 5,
  brightIntensity: 1.0,
  darkIntensity: 1.0,
};