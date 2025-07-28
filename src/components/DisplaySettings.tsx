import React from 'react';
import { DisplayMode } from '../types/UITypes';
import { ControlPanel } from './ControlPanel';

interface DisplaySettingsProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onSelectAnotherImage: () => void;
}

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  displayMode,
  onDisplayModeChange,
  onSelectAnotherImage,
}) => {
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="flex-1 overflow-y-auto">
        <ControlPanel
          displayMode={displayMode}
          onDisplayModeChange={onDisplayModeChange}
        />
        <div className="px-6 pb-6">
          <button
            onClick={onSelectAnotherImage}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 font-semibold"
          >
            Select Another Image
          </button>
        </div>
      </div>
    </div>
  );
};