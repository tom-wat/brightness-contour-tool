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

      </div>
    </div>
  );
};