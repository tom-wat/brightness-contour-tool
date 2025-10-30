import React from 'react';
import { DisplayOptions } from '../types/UITypes';
import { ExportControls } from './ExportControls';
import { ExportSettings } from '../hooks/useImageExport';
import { SettingsStorage } from '../hooks/useLocalStorage';

interface DisplaySettingsProps {
  displayOptions: DisplayOptions;
  onDisplayOptionsChange: (options: DisplayOptions) => void;
  onExport: (settings: ExportSettings) => Promise<void>;
  isExporting?: boolean;
  hasContour?: boolean;
}

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  displayOptions,
  onDisplayOptionsChange,
  onExport,
  isExporting,
  hasContour = false,
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

  // All Frequency Layersボタンの状態を独立して管理（localStorage対応）
  const [allFrequencyLayersState, setAllFrequencyLayersState] = React.useState(() =>
    SettingsStorage.getAllFrequencyLayersState(false)
  );

  const handleToggleAllFrequency = () => {
    const newState = !allFrequencyLayersState;
    setAllFrequencyLayersState(newState);
    SettingsStorage.saveAllFrequencyLayersState(newState);
    onDisplayOptionsChange({
      ...displayOptions,
      layers: {
        ...displayOptions.layers,
        lowFrequency: newState,
        highFrequencyCombined: newState,
        // Bright/Dark Details are not affected
      },
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
                aria-label="Toggle original layer"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displayOptions.layers.original ? 'translate-x-6' : 'translate-x-1'
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
                aria-label="Toggle contour layer"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displayOptions.layers.contour && hasContour ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Filtered Layer */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Filtered
              </label>
              <button
                onClick={() => handleLayerToggle('filtered')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  displayOptions.layers.filtered ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-label="Toggle filtered layer"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displayOptions.layers.filtered ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Filtered Contour Layer */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Filtered Contour
              </label>
              <button
                onClick={() => handleLayerToggle('filteredContour')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  displayOptions.layers.filteredContour ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-label="Toggle filtered contour layer"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displayOptions.layers.filteredContour ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Edge Layer */}

            {/* All Frequency Layers */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                All Frequency Layers
              </label>
              <button
                onClick={handleToggleAllFrequency}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  allFrequencyLayersState ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-label="Toggle all frequency layers"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    allFrequencyLayersState ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

              {/* Low Frequency Layer */}
              <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Low Frequency
                  </label>
                  <button
                    onClick={() => handleLayerToggle('lowFrequency')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      displayOptions.layers.lowFrequency ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label="Toggle low frequency layer"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        displayOptions.layers.lowFrequency ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

              {/* High Frequency Layer */}
              <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    High Frequency
                  </label>
                  <button
                    onClick={() => handleLayerToggle('highFrequencyCombined')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      displayOptions.layers.highFrequencyCombined ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label="Toggle high frequency layer"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        displayOptions.layers.highFrequencyCombined ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

              {/* High Frequency Bright Layer */}
              <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Bright Details
                  </label>
                  <button
                    onClick={() => handleLayerToggle('highFrequencyBright')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      displayOptions.layers.highFrequencyBright ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label="Toggle bright details layer"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        displayOptions.layers.highFrequencyBright ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

              {/* High Frequency Dark Layer */}
              <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Dark Details
                  </label>
                  <button
                    onClick={() => handleLayerToggle('highFrequencyDark')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      displayOptions.layers.highFrequencyDark ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label="Toggle dark details layer"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        displayOptions.layers.highFrequencyDark ? 'translate-x-6' : 'translate-x-1'
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
                aria-label="Toggle grayscale mode"
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