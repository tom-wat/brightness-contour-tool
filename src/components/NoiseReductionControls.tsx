import React from 'react';
import { NoiseReductionSettings } from '../types/NoiseReductionTypes';

interface NoiseReductionControlsProps {
  settings: NoiseReductionSettings;
  onSettingsChange: (settings: Partial<NoiseReductionSettings>) => void;
  onApply: () => void;
  processing: boolean;
  error: string | null;
  hasImageData: boolean;
  openCVLoaded: boolean;
  openCVLoading: boolean;
  openCVError: string | null;
}

export const NoiseReductionControls: React.FC<NoiseReductionControlsProps> = ({
  settings,
  onSettingsChange,
  onApply,
  processing,
  error,
  hasImageData,
  openCVLoaded,
  openCVLoading,
  openCVError,
}) => {
  return (
    <div className="p-6 border-b border-gray-100 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 text-base">Noise Reduction</h3>
      </div>

      {openCVLoading && (
        <p className="text-xs text-gray-500">Loading OpenCV.js...</p>
      )}
      {openCVError && (
        <p className="text-xs text-red-600">OpenCV.js load error: {openCVError}</p>
      )}

      <div>
        <button
          onClick={onApply}
          disabled={!hasImageData || processing || !openCVLoaded}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center"
        >
          {processing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {processing ? 'Processing...' : 'Apply Noise Reduction'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="space-y-3">
        {/* Luminance Strength */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Luminance: {settings.luminanceStrength}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.luminanceStrength}
            onChange={(e) => onSettingsChange({ luminanceStrength: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={processing}
          />
        </div>

        {/* Color Strength */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colour: {settings.colorStrength}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.colorStrength}
            onChange={(e) => onSettingsChange({ colorStrength: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={processing}
          />
        </div>

        {/* Detail Preservation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detail: {settings.detail}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.detail}
            onChange={(e) => onSettingsChange({ detail: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={processing}
          />
        </div>

        {/* Radius */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Radius: {settings.radius}px
          </label>
          <input
            type="range"
            min="1"
            max="7"
            value={settings.radius}
            onChange={(e) => onSettingsChange({ radius: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={processing}
          />
        </div>

        {/* Layer Opacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacity: {Math.round(settings.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(settings.opacity * 100)}
            onChange={(e) => onSettingsChange({ opacity: parseInt(e.target.value) / 100 })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={processing}
          />
        </div>
      </div>
    </div>
  );
};
