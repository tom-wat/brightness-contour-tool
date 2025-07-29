import React from 'react';
import { DisplayMode, DISPLAY_MODE_LABELS } from '../types/UITypes';

interface ControlPanelProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  displayMode,
  onDisplayModeChange,
}) => {

  const basicDisplayModes = [
    DisplayMode.COLOR_ONLY,
    DisplayMode.GRAYSCALE_ONLY,
    DisplayMode.CONTOUR_ONLY,
    DisplayMode.COLOR_WITH_CONTOUR,
    DisplayMode.GRAYSCALE_WITH_CONTOUR,
  ];

  const cannyDisplayModes = [
    DisplayMode.CANNY_EDGE_ONLY,
    DisplayMode.COLOR_WITH_CANNY,
    DisplayMode.CONTOUR_WITH_CANNY,
    DisplayMode.GRAYSCALE_WITH_CONTOUR_AND_CANNY,
    DisplayMode.COLOR_WITH_CONTOUR_AND_CANNY,
  ];

  const noiseReductionDisplayModes = [
    DisplayMode.DENOISED_ONLY,
    DisplayMode.DENOISED_GRAYSCALE_ONLY,
    DisplayMode.DENOISED_CONTOUR_ONLY,
    DisplayMode.COLOR_WITH_DENOISED_CONTOUR,
    DisplayMode.GRAYSCALE_WITH_DENOISED_CONTOUR,
    DisplayMode.DENOISED_WITH_CANNY,
    DisplayMode.ALL_WITH_DENOISING,
    DisplayMode.ALL_WITH_DENOISING_GRAYSCALE,
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Settings</h2>
      </div>        
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Display Mode
          </label>
          
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={displayMode}
            onChange={(e) => onDisplayModeChange(e.target.value as DisplayMode)}
          >
            <optgroup label="Basic Modes">
              {basicDisplayModes.map((mode) => (
                <option key={mode} value={mode}>
                  {DISPLAY_MODE_LABELS[mode]}
                </option>
              ))}
            </optgroup>
            
            <optgroup label="Canny Edge Detection">
              {cannyDisplayModes.map((mode) => (
                <option key={mode} value={mode}>
                  {DISPLAY_MODE_LABELS[mode]}
                </option>
              ))}
            </optgroup>
            
            <optgroup label="Noise Reduction">
              {noiseReductionDisplayModes.map((mode) => (
                <option key={mode} value={mode}>
                  {DISPLAY_MODE_LABELS[mode]}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

      </div>
    </div>
  );
};