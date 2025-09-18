import React from 'react';
import { FrequencySettings, FREQUENCY_PRESETS } from '../types/FrequencyTypes';

interface FrequencyControlsProps {
  settings: FrequencySettings;
  onSettingsChange: (settings: FrequencySettings) => void;
  onApply: () => void;
  isProcessing: boolean;
  hasImageData: boolean;
}

export const FrequencyControls: React.FC<FrequencyControlsProps> = ({
  settings,
  onSettingsChange,
  onApply,
  isProcessing,
  hasImageData,
}) => {
  const handlePresetChange = (presetName: string) => {
    const preset = FREQUENCY_PRESETS.find(p => p.name === presetName);
    if (preset) {
      onSettingsChange(preset.settings);
    }
  };

  const handleSettingChange = (key: keyof FrequencySettings, value: number) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="p-6 border-b border-gray-200 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 text-base">Frequency Separation</h3>
      </div>

      {isProcessing && (
        <div className="bg-blue-50 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-600">Processing frequency separation...</p>
          </div>
        </div>
      )}

      <div>
        <button
          onClick={onApply}
          disabled={!hasImageData || isProcessing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isProcessing ? 'Processing...' : 'Apply Frequency Separation'}
        </button>
      </div>

      <div className="space-y-3">
        {/* Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Presets
          </label>
          <select
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isProcessing}
          >
            <option value="">Custom</option>
            {FREQUENCY_PRESETS.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Blur Radius */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blur Radius: {settings.blurRadius}px
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={settings.blurRadius}
            onChange={(e) => handleSettingChange('blurRadius', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={isProcessing}
          />
        </div>

        {/* Intensity Controls */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bright Intensity: {settings.brightIntensity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={settings.brightIntensity}
              onChange={(e) => handleSettingChange('brightIntensity', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dark Intensity: {settings.darkIntensity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={settings.darkIntensity}
              onChange={(e) => handleSettingChange('darkIntensity', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={isProcessing}
            />
          </div>
        </div>

      </div>
    </div>
  );
};