import React from 'react';
import { ContourSettings } from '../types/ImageTypes';

interface ContourControlsProps {
  contourSettings: ContourSettings;
  onContourSettingsChange: (settings: ContourSettings) => void;
}

export const ContourControls: React.FC<ContourControlsProps> = ({
  contourSettings,
  onContourSettingsChange,
}) => {
  const handleLevelsChange = (levels: number) => {
    onContourSettingsChange({ ...contourSettings, levels });
  };

  const handleTransparencyChange = (transparency: number) => {
    onContourSettingsChange({ ...contourSettings, transparency });
  };

  const handleMinDistanceChange = (minContourDistance: number) => {
    onContourSettingsChange({ ...contourSettings, minContourDistance });
  };

  const handleContourContrastChange = (contourContrast: number) => {
    onContourSettingsChange({ ...contourSettings, contourContrast });
  };




  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-md font-semibold text-gray-900 mb-4">Contour Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brightness Levels: {contourSettings.levels}
          </label>
          <input
            type="range"
            min="1"
            max="64"
            step="1"
            value={contourSettings.levels}
            onChange={(e) => handleLevelsChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>64</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacity: {contourSettings.transparency}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={contourSettings.transparency}
            onChange={(e) => handleTransparencyChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contour Contrast: {contourSettings.contourContrast || 0}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={contourSettings.contourContrast || 0}
            onChange={(e) => handleContourContrastChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0% (No Enhancement)</span>
            <span>100% (Maximum Contrast)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enhance contrast: -25 areas become darker, +75 areas become brighter
          </p>
        </div>

        {contourSettings.levels >= 15 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Contour Distance: {contourSettings.minContourDistance || 0}px
            </label>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={contourSettings.minContourDistance || 0}
              onChange={(e) => handleMinDistanceChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0px (Off)</span>
              <span>8px</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Remove overlapping contours (levels ≥15 only, optimized for performance)
            </p>
          </div>
        )}

      </div>
    </div>
  );
};