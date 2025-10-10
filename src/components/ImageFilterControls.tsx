import React from 'react';
import {
  ImageFilterSettings,
  ImageFilterMethod
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
  const handleMethodChange = (method: ImageFilterMethod) => {
    // methodの変更時は自動的に有効化
    onSettingsChange({
      method,
      enabled: true
    });
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


      <div>
        <button
          onClick={onApplyImageFilter}
          disabled={processing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center"
        >
          {processing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {processing ? 'Processing...' : 'Apply Image Filter'}
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter Method</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={settings.method}
            onChange={(e) => handleMethodChange(e.target.value as ImageFilterMethod)}
            disabled={processing}
          >
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
                Blur Radius: {settings.gaussianParams.radius.toFixed(0)}px
              </label>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={settings.gaussianParams.radius}
                onChange={(e) => onSettingsChange({
                  gaussianParams: { ...settings.gaussianParams, radius: parseFloat(e.target.value) }
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
              Filter Radius: {settings.medianParams.radius.toFixed(0)}px
            </label>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={settings.medianParams.radius}
              onChange={(e) => onSettingsChange({
                medianParams: { ...settings.medianParams, radius: parseFloat(e.target.value) }
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={processing}
            />
          </div>
        )}

      </div>
    </div>
  );
};