import React from 'react';
import { FrequencySettings, FrequencyFilterMethod } from '../types/FrequencyTypes';

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
  const handleSettingChange = (key: keyof FrequencySettings, value: number | string) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const handleMethodChange = (method: FrequencyFilterMethod) => {
    onSettingsChange({
      ...settings,
      filterMethod: method,
    });
  };

  return (
    <div className="p-6 border-b border-gray-200 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 text-base">Frequency Separation</h3>
      </div>


      <div>
        <button
          onClick={onApply}
          disabled={!hasImageData || isProcessing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center"
        >
          {isProcessing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {isProcessing ? 'Processing...' : 'Apply Frequency Separation'}
        </button>
      </div>

      <div className="space-y-3">
        {/* Filter Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter Method</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={settings.filterMethod}
            onChange={(e) => handleMethodChange(e.target.value as FrequencyFilterMethod)}
            disabled={isProcessing}
          >
            <option value="gaussian">Gaussian Blur</option>
            <option value="median">Median Filter</option>
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
              min="0"
              max="3"
              step="1"
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
              min="0"
              max="3"
              step="1"
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