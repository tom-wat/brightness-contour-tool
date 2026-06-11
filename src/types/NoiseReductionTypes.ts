export interface NoiseReductionSettings {
  luminanceStrength: number; // 0-100 輝度ノイズ除去の強さ（YCrCbのYチャンネル）
  colorStrength: number; // 0-100 色ノイズ除去の強さ（Cr/Cbチャンネル）
  detail: number; // 0-100 元画像の高周波成分を戻す量（テクスチャ保持）
  radius: number; // 1-7 バイラテラルフィルタの半径（直径 = radius*2+1）
  opacity: number; // 0-1 Denoisedレイヤーのブレンド率
}

export interface NoiseReductionResult {
  denoisedImageData: ImageData | null;
  processing: boolean;
  error: string | null;
  processingTime: number;
}

// 絵画写真向けデフォルト: 色ノイズは強め、輝度は控えめにしてテクスチャを守る
export const DEFAULT_NOISE_REDUCTION_SETTINGS: NoiseReductionSettings = {
  luminanceStrength: 25,
  colorStrength: 60,
  detail: 30,
  radius: 3,
  opacity: 1.0,
};
