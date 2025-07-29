import React from 'react';
import { EdgeProcessingSettings } from '../types/EdgeProcessingTypes';

interface EdgeProcessingControlsProps {
  settings: EdgeProcessingSettings;
  onSettingsChange: (settings: EdgeProcessingSettings) => void;
}

export const EdgeProcessingControls: React.FC<EdgeProcessingControlsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleToggle = (key: keyof EdgeProcessingSettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleThresholdChange = (value: number) => {
    onSettingsChange({
      ...settings,
      shortEdgeThreshold: value,
    });
  };

  const handleDistanceChange = (value: number) => {
    onSettingsChange({
      ...settings,
      connectionDistance: value,
    });
  };

  return (
    <div className="p-6">
      <h3 className="text-md font-semibold text-gray-900 mb-4">Edge Post-Processing</h3>
      
      <div className="space-y-4">
        {/* Edge Thinning */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Edge Thinning
          </label>
          <label className="relative inline-flex cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableThinning}
              onChange={() => handleToggle('enableThinning')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Short Edge Removal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Remove Short Edges
            </label>
            <label className="relative inline-flex cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableShortEdgeRemoval}
                onChange={() => handleToggle('enableShortEdgeRemoval')}
                  className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {settings.enableShortEdgeRemoval && (
            <div className="ml-4">
              <label className="block text-sm text-gray-600 mb-2">
                Minimum Length: {settings.shortEdgeThreshold}px
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={settings.shortEdgeThreshold}
                onChange={(e) => handleThresholdChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5px</span>
                <span>50px</span>
              </div>
            </div>
          )}
        </div>

        {/* Edge Connection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Connect Nearby Edges
            </label>
            <label className="relative inline-flex cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableEdgeConnection}
                onChange={() => handleToggle('enableEdgeConnection')}
                  className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {settings.enableEdgeConnection && (
            <div className="ml-4">
              <label className="block text-sm text-gray-600 mb-2">
                Max Distance: {settings.connectionDistance}px
              </label>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={settings.connectionDistance}
                onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1px</span>
                <span>15px</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};