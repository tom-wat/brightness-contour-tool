import React from 'react';
import {
  ImageFilterSettings,
  ImageFilterMethod,
  IMAGE_FILTER_PRESETS
} from '../types/ImageFilterTypes';

interface ImageFilterControlsProps {
  settings: ImageFilterSettings;
  onSettingsChange: (settings: Partial<ImageFilterSettings>) => void;
  processing: boolean;
  error: string | null;
  onApplyImageFilter: () => void;
}

export const ImageFilterControls: React.FC<ImageFilterControlsProps> = ({
  settings,
  onSettingsChange,
  processing,
  error,
  onApplyImageFilter
}) => {
  // 現在の設定がプリセットと一致するかチェック
  const getCurrentPresetIndex = () => {
    for (let i = 0; i < IMAGE_FILTER_PRESETS.length; i++) {
      const preset = IMAGE_FILTER_PRESETS[i];
      if (preset && isSettingsEqual(settings, preset.settings)) {
        return i;
      }
    }
    return -1; // カスタム設定
  };

  // 設定が等しいかチェックする関数
  const isSettingsEqual = (settings1: ImageFilterSettings, settings2: ImageFilterSettings) => {
    return (
      settings1.method === settings2.method &&
      settings1.enabled === settings2.enabled &&
      JSON.stringify(settings1.medianParams) === JSON.stringify(settings2.medianParams) &&
      JSON.stringify(settings1.gaussianParams) === JSON.stringify(settings2.gaussianParams)
    );
  };
  const handleMethodChange = (method: ImageFilterMethod) => {
    // methodの変更時、'none'以外の場合は自動的に有効化
    onSettingsChange({ 
      method, 
      enabled: method !== 'none' 
    });
  };

  const handlePresetChange = (presetIndex: number) => {
    if (presetIndex === -1) {
      // カスタム設定は何もしない
      return;
    }
    
    if (presetIndex >= 0 && presetIndex < IMAGE_FILTER_PRESETS.length) {
      const preset = IMAGE_FILTER_PRESETS[presetIndex];
      if (preset && preset.settings) {
        // プリセット適用時は自動的に有効化
        onSettingsChange({
          ...preset.settings,
          enabled: true
        });
      } else {
        console.error(`Preset at index ${presetIndex} is invalid:`, preset);
      }
    } else {
      console.error(`Invalid preset index: ${presetIndex}`);
    }
  };

  return (
    <div className="p-6 border-b border-gray-200 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 text-base">Image Filter</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {processing && (
        <div className="bg-blue-50 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-600">Processing image filter...</p>
          </div>
        </div>
      )}

      <div>
        <button
          onClick={onApplyImageFilter}
          disabled={processing || settings.method === 'none'}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
        >
          {processing ? 'Processing...' : 'Apply Image Filter'}
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preset</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value)) {
                handlePresetChange(value);
              }
            }}
            disabled={processing}
            value={getCurrentPresetIndex()}
          >
            <option value={-1}>Custom Settings</option>
            {IMAGE_FILTER_PRESETS.map((preset, index) => (
              <option key={index} value={index}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter Method</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={settings.method}
            onChange={(e) => handleMethodChange(e.target.value as ImageFilterMethod)}
            disabled={processing}
          >
            <option value="none">Disabled</option>
            <option value="gaussian">Gaussian Blur</option>
            <option value="median">Median Filter</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacity: {(settings.opacity * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.opacity}
            onChange={(e) => onSettingsChange({ opacity: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={processing}
          />
        </div>

        {settings.method === 'gaussian' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kernel Size: {settings.gaussianParams.kernelSize}
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={settings.gaussianParams.kernelSize}
                onChange={(e) => onSettingsChange({
                  gaussianParams: { ...settings.gaussianParams, kernelSize: parseInt(e.target.value) }
                })}
                disabled={processing}
              >
                <option value={3}>3×3</option>
                <option value={5}>5×5</option>
                <option value={7}>7×7</option>
                <option value={9}>9×9</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sigma X: {settings.gaussianParams.sigmaX.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={settings.gaussianParams.sigmaX}
                onChange={(e) => onSettingsChange({
                  gaussianParams: { ...settings.gaussianParams, sigmaX: parseFloat(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={processing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sigma Y: {settings.gaussianParams.sigmaY.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={settings.gaussianParams.sigmaY}
                onChange={(e) => onSettingsChange({
                  gaussianParams: { ...settings.gaussianParams, sigmaY: parseFloat(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={processing}
              />
            </div>
          </div>
        )}

        {settings.method === 'median' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kernel Size: {settings.medianParams.kernelSize}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={settings.medianParams.kernelSize}
              onChange={(e) => onSettingsChange({
                medianParams: { ...settings.medianParams, kernelSize: parseInt(e.target.value) }
              })}
              disabled={processing}
            >
              <option value={3}>3×3</option>
              <option value={5}>5×5</option>
              <option value={7}>7×7</option>
              <option value={9}>9×9</option>
            </select>
          </div>
        )}

      </div>
    </div>
  );
};