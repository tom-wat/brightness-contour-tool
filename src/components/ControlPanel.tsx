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
          
          {/* Basic Display Modes */}
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">Basic Modes</div>
            <div className="space-y-2">
              {basicDisplayModes.map((mode) => (
                <label key={mode} className="flex items-center">
                  <input
                    type="radio"
                    name="displayMode"
                    value={mode}
                    checked={displayMode === mode}
                    onChange={(e) => onDisplayModeChange(e.target.value as DisplayMode)}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {DISPLAY_MODE_LABELS[mode]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Canny Edge Detection Modes */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Canny Edge Detection</div>
            <div className="space-y-2">
              {cannyDisplayModes.map((mode) => (
                <label key={mode} className="flex items-center">
                  <input
                    type="radio"
                    name="displayMode"
                    value={mode}
                    checked={displayMode === mode}
                    onChange={(e) => onDisplayModeChange(e.target.value as DisplayMode)}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {DISPLAY_MODE_LABELS[mode]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};