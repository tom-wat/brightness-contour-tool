export type FrequencyFilterMethod = 'gaussian' | 'median' | 'bilateral' | 'guided';

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
  // bilateral 用（spatial 半径は blurRadius を流用、sigmaSpace は blurRadius から導出）
  bilateralSigmaColor: number;
  // guided 用（正則化 eps にマッピングされる平滑化強度）
  guidedStrength: number;
}

export const DEFAULT_FREQUENCY_SETTINGS: FrequencySettings = {
  filterMethod: 'gaussian',
  blurRadius: 5,
  brightIntensity: 1.0,
  darkIntensity: 1.0,
  bilateralSigmaColor: 50,
  guidedStrength: 30,
};