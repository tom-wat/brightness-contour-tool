import React from 'react';
import { DisplayMode, DISPLAY_MODE_LABELS } from '../types/UITypes';
import { ContourSettings } from '../types/ImageTypes';

interface ControlPanelProps {
  displayMode: DisplayMode;
  contourSettings: ContourSettings;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onContourSettingsChange: (settings: ContourSettings) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  displayMode,
  contourSettings,
  onDisplayModeChange,
  onContourSettingsChange,
}) => {
  const handleLevelsChange = (levels: number) => {
    onContourSettingsChange({ ...contourSettings, levels });
  };

  const handleThicknessChange = (lineThickness: number) => {
    onContourSettingsChange({ ...contourSettings, lineThickness });
  };

  const handleTransparencyChange = (transparency: number) => {
    onContourSettingsChange({ ...contourSettings, transparency });
  };

  const handleGaussianBlurChange = (gaussianBlur: number) => {
    onContourSettingsChange({ ...contourSettings, gaussianBlur });
  };

  const basicDisplayModes = [
    DisplayMode.COLOR_ONLY,
    DisplayMode.GRAYSCALE_ONLY,
    DisplayMode.CONTOUR_ONLY,
    DisplayMode.COLOR_WITH_CONTOUR,
    DisplayMode.GRAYSCALE_WITH_CONTOUR,
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Display Settings</h2>
      </div>
        
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Display Mode
          </label>
          <div className="space-y-2">
            {basicDisplayModes.map((mode) => (
              <label key={mode} className="flex items-center">
                <input
                  type="radio"
                  name="displayMode"
                  value={mode}
                  checked={displayMode === mode}
                  onChange={(e) => onDisplayModeChange(e.target.value as DisplayMode)}
                  className="h-4 w-4 text-slate-900 focus:ring-slate-500 border-slate-300"
                />
                <span className="ml-2 text-sm text-slate-700">
                  {DISPLAY_MODE_LABELS[mode]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Brightness Levels: {contourSettings.levels}
          </label>
          <input
            type="range"
            min="1"
            max="64"
            step="1"
            value={contourSettings.levels}
            onChange={(e) => handleLevelsChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1</span>
            <span>64</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Line Thickness: {contourSettings.lineThickness}px
          </label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={contourSettings.lineThickness}
            onChange={(e) => handleThicknessChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1px</span>
            <span>5px</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Opacity: {contourSettings.transparency}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={contourSettings.transparency}
            onChange={(e) => handleTransparencyChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Gaussian Blur: {contourSettings.gaussianBlur}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={contourSettings.gaussianBlur}
            onChange={(e) => handleGaussianBlurChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0</span>
            <span>10</span>
          </div>
        </div>
      </div>
    </div>
  );
};