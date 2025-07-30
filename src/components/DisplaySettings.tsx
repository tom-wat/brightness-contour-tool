import React from 'react';
import { DisplayOptions } from '../types/UITypes';
import { ExportControls } from './ExportControls';
import { ExportSettings } from '../hooks/useImageExport';

interface DisplaySettingsProps {
  displayOptions: DisplayOptions;
  onDisplayOptionsChange: (options: DisplayOptions) => void;
  onExport: (settings: ExportSettings) => Promise<void>;
  isExporting?: boolean;
  hasFiltered?: boolean;
  hasContour?: boolean;
  hasFilteredContour?: boolean;
  hasEdge?: boolean;
}

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  displayOptions,
  onDisplayOptionsChange,
  onExport,
  isExporting,
  hasFiltered = false,
  hasContour = false,
  hasFilteredContour = false,
  hasEdge = false,
}) => {
  const handleLayerToggle = (layer: keyof typeof displayOptions.layers) => {
    onDisplayOptionsChange({
      ...displayOptions,
      layers: {
        ...displayOptions.layers,
        [layer]: !displayOptions.layers[layer],
      },
    });
  };

  const handleGrayscaleModeToggle = () => {
    onDisplayOptionsChange({
      ...displayOptions,
      grayscaleMode: !displayOptions.grayscaleMode,
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 text-base mb-4">Display Layers</h3>
          </div>

          <div className="space-y-3">
            {/* Original Layer */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Original</label>
              <button
                onClick={() => handleLayerToggle('original')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  displayOptions.layers.original ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displayOptions.layers.original ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Filtered Layer */}
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${hasFiltered ? 'text-gray-700' : 'text-gray-400'}`}>
                Filtered
              </label>
              <button
                onClick={() => handleLayerToggle('filtered')}
                disabled={!hasFiltered}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  displayOptions.layers.filtered && hasFiltered ? 'bg-blue-600' : 'bg-gray-200'
                } ${!hasFiltered ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displayOptions.layers.filtered && hasFiltered ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Contour Layer */}
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${hasContour ? 'text-gray-700' : 'text-gray-400'}`}>
                Contour
              </label>
              <button
                onClick={() => handleLayerToggle('contour')}
                disabled={!hasContour}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  displayOptions.layers.contour && hasContour ? 'bg-blue-600' : 'bg-gray-200'
                } ${!hasContour ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displayOptions.layers.contour && hasContour ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Filtered Contour Layer */}
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${hasFilteredContour ? 'text-gray-700' : 'text-gray-400'}`}>
                Filtered Contour
              </label>
              <button
                onClick={() => handleLayerToggle('filteredContour')}
                disabled={!hasFilteredContour}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  displayOptions.layers.filteredContour && hasFilteredContour ? 'bg-blue-600' : 'bg-gray-200'
                } ${!hasFilteredContour ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displayOptions.layers.filteredContour && hasFilteredContour ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Edge Layer */}
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${hasEdge ? 'text-gray-700' : 'text-gray-400'}`}>
                Edge
              </label>
              <button
                onClick={() => handleLayerToggle('edge')}
                disabled={!hasEdge}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  displayOptions.layers.edge && hasEdge ? 'bg-blue-600' : 'bg-gray-200'
                } ${!hasEdge ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displayOptions.layers.edge && hasEdge ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Grayscale Mode */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Grayscale Mode</label>
              <button
                onClick={handleGrayscaleModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  displayOptions.grayscaleMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displayOptions.grayscaleMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <ExportControls
          onExport={onExport}
          isExporting={isExporting}
        />
      </div>
    </div>
  );
};