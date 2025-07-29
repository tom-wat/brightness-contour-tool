import React, { useState } from 'react';
import { ExportSettings } from '../hooks/useImageExport';

interface ExportControlsProps {
  onExport: (settings: ExportSettings) => Promise<void>;
  isExporting?: boolean;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  onExport,
  isExporting = false,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(90);
  const [customFilename, setCustomFilename] = useState('');

  const handleExport = async () => {
    const settings: ExportSettings = {
      format,
      quality,
      includeOriginalSize: true,
      filename: customFilename.trim() || undefined,
    };

    try {
      await onExport(settings);
    } catch (error) {
      console.error('Export failed:', error);
      // エラーハンドリングは親コンポーネントで行う
    }
  };

  return (
    <div className="p-6 border-t border-gray-200">
      <h3 className="text-md font-semibold text-gray-900 mb-4">Export Image</h3>
      
      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="png"
                checked={format === 'png'}
                onChange={(e) => setFormat(e.target.value as 'png')}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">PNG</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="jpeg"
                checked={format === 'jpeg'}
                onChange={(e) => setFormat(e.target.value as 'jpeg')}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">JPEG</span>
            </label>
          </div>
        </div>

        {/* JPEG Quality */}
        {format === 'jpeg' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality: {quality}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Custom Filename */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filename (optional)
          </label>
          <input
            type="text"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            placeholder="Leave empty for auto-generated name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
          <div className="text-xs text-gray-500 mt-1">
            {customFilename.trim() 
              ? `${customFilename.trim()}.${format}`
              : `Auto: brightness-contour-[mode]-[timestamp].${format}`
            }
          </div>
        </div>


        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isExporting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </div>
          ) : (
            `Export as ${format.toUpperCase()}`
          )}
        </button>
      </div>
    </div>
  );
};