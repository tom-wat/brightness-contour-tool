import React from 'react';
import { DisplayMode } from '../types/UITypes';
import { ControlPanel } from './ControlPanel';
import { ExportControls } from './ExportControls';
import { ExportSettings } from '../hooks/useImageExport';

interface DisplaySettingsProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onExport: (settings: ExportSettings) => Promise<void>;
  isExporting?: boolean;
}

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  displayMode,
  onDisplayModeChange,
  onExport,
  isExporting,
}) => {
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <ControlPanel
          displayMode={displayMode}
          onDisplayModeChange={onDisplayModeChange}
        />
        <ExportControls
          onExport={onExport}
          isExporting={isExporting}
        />
      </div>
    </div>
  );
};