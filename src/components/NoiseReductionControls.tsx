import React from 'react';
import {
  NoiseReductionSettings,
  NoiseReductionMethod,
  NOISE_REDUCTION_PRESETS
} from '../types/NoiseReductionTypes';

interface NoiseReductionControlsProps {
  settings: NoiseReductionSettings;
  onSettingsChange: (settings: Partial<NoiseReductionSettings>) => void;
  processing: boolean;
  processingTime: number;
  error: string | null;
}

export const NoiseReductionControls: React.FC<NoiseReductionControlsProps> = ({
  settings,
  onSettingsChange,
  processing,
  processingTime,
  error
}) => {
  // 現在の設定がプリセットと一致するかチェック
  const getCurrentPresetIndex = () => {
    for (let i = 0; i < NOISE_REDUCTION_PRESETS.length; i++) {
      const preset = NOISE_REDUCTION_PRESETS[i];
      if (preset && isSettingsEqual(settings, preset.settings)) {
        return i;
      }
    }
    return -1; // カスタム設定
  };

  // 設定が等しいかチェックする関数
  const isSettingsEqual = (settings1: NoiseReductionSettings, settings2: NoiseReductionSettings) => {
    return (
      settings1.method === settings2.method &&
      settings1.enabled === settings2.enabled &&
      JSON.stringify(settings1.medianParams) === JSON.stringify(settings2.medianParams) &&
      JSON.stringify(settings1.bilateralParams) === JSON.stringify(settings2.bilateralParams) &&
      JSON.stringify(settings1.nlmeansParams) === JSON.stringify(settings2.nlmeansParams) &&
      JSON.stringify(settings1.morphologyParams) === JSON.stringify(settings2.morphologyParams)
    );
  };
  const handleMethodChange = (method: NoiseReductionMethod) => {
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
    
    if (presetIndex >= 0 && presetIndex < NOISE_REDUCTION_PRESETS.length) {
      const preset = NOISE_REDUCTION_PRESETS[presetIndex];
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
    <div className="bg-white rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-base">Noise Reduction</h3>
        <div className="flex items-center space-x-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.enabled}
              onChange={(e) => onSettingsChange({ enabled: e.target.checked })}
              disabled={processing}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
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
            <p className="text-sm text-blue-600">Processing noise reduction...</p>
          </div>
        </div>
      )}

      {processingTime > 0 && !processing && (
        <div className="text-xs text-gray-500">
          Processing time: {processingTime.toFixed(1)}ms
        </div>
      )}

      <div className={`space-y-3 ${!settings.enabled ? 'opacity-50' : ''}`}>
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
            disabled={processing || !settings.enabled}
            value={getCurrentPresetIndex()}
          >
            <option value={-1}>Custom Settings</option>
            {NOISE_REDUCTION_PRESETS.map((preset, index) => (
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
            onChange={(e) => handleMethodChange(e.target.value as NoiseReductionMethod)}
            disabled={processing || !settings.enabled}
          >
            <option value="none">Disabled</option>
            <option value="median">Median Filter</option>
            <option value="bilateral">Bilateral Filter</option>
            <option value="nlmeans">Non-Local Means</option>
            <option value="morphology">Morphology</option>
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
            disabled={processing || !settings.enabled}
          />
        </div>

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
              disabled={processing || !settings.enabled}
            >
              <option value={3}>3×3</option>
              <option value={5}>5×5</option>
              <option value={7}>7×7</option>
              <option value={9}>9×9</option>
            </select>
          </div>
        )}

        {settings.method === 'bilateral' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diameter: {settings.bilateralParams.d}
              </label>
              <input
                type="range"
                min="5"
                max="25"
                step="2"
                value={settings.bilateralParams.d}
                onChange={(e) => onSettingsChange({
                  bilateralParams: { ...settings.bilateralParams, d: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={processing || !settings.enabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Sigma: {settings.bilateralParams.sigmaColor}
              </label>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={settings.bilateralParams.sigmaColor}
                onChange={(e) => onSettingsChange({
                  bilateralParams: { ...settings.bilateralParams, sigmaColor: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={processing || !settings.enabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Space Sigma: {settings.bilateralParams.sigmaSpace}
              </label>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={settings.bilateralParams.sigmaSpace}
                onChange={(e) => onSettingsChange({
                  bilateralParams: { ...settings.bilateralParams, sigmaSpace: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={processing || !settings.enabled}
              />
            </div>
          </div>
        )}

        {settings.method === 'nlmeans' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Strength: {settings.nlmeansParams.h}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                step="1"
                value={settings.nlmeansParams.h}
                onChange={(e) => onSettingsChange({
                  nlmeansParams: { ...settings.nlmeansParams, h: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={processing || !settings.enabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Window: {settings.nlmeansParams.templateWindowSize}
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={settings.nlmeansParams.templateWindowSize}
                onChange={(e) => onSettingsChange({
                  nlmeansParams: { ...settings.nlmeansParams, templateWindowSize: parseInt(e.target.value) }
                })}
                disabled={processing || !settings.enabled}
              >
                <option value={7}>7×7</option>
                <option value={21}>21×21</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Window: {settings.nlmeansParams.searchWindowSize}
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={settings.nlmeansParams.searchWindowSize}
                onChange={(e) => onSettingsChange({
                  nlmeansParams: { ...settings.nlmeansParams, searchWindowSize: parseInt(e.target.value) }
                })}
                disabled={processing || !settings.enabled}
              >
                <option value={21}>21×21</option>
                <option value={35}>35×35</option>
              </select>
            </div>
          </div>
        )}

        {settings.method === 'morphology' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operation Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={settings.morphologyParams.operation}
                onChange={(e) => onSettingsChange({
                  morphologyParams: { ...settings.morphologyParams, operation: e.target.value as any }
                })}
                disabled={processing || !settings.enabled}
              >
                <option value="opening">Opening</option>
                <option value="closing">Closing</option>
                <option value="gradient">Gradient</option>
                <option value="tophat">Top Hat</option>
                <option value="blackhat">Black Hat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kernel Shape</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={settings.morphologyParams.kernelShape}
                onChange={(e) => onSettingsChange({
                  morphologyParams: { ...settings.morphologyParams, kernelShape: e.target.value as any }
                })}
                disabled={processing || !settings.enabled}
              >
                <option value="rect">Rectangle</option>
                <option value="ellipse">Ellipse</option>
                <option value="cross">Cross</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kernel Size: {settings.morphologyParams.kernelSize}
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={settings.morphologyParams.kernelSize}
                onChange={(e) => onSettingsChange({
                  morphologyParams: { ...settings.morphologyParams, kernelSize: parseInt(e.target.value) }
                })}
                disabled={processing || !settings.enabled}
              >
                <option value={3}>3×3</option>
                <option value={5}>5×5</option>
                <option value={7}>7×7</option>
                <option value={9}>9×9</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Iterations: {settings.morphologyParams.iterations}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={settings.morphologyParams.iterations}
                onChange={(e) => onSettingsChange({
                  morphologyParams: { ...settings.morphologyParams, iterations: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={processing || !settings.enabled}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};