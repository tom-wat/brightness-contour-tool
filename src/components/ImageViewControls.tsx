import React from 'react';

interface ImageViewControlsProps {
  // 後で実装するズーム機能用のprops
  // zoomLevel?: number;
  // onZoomChange?: (level: number) => void;
  // onFitToScreen?: () => void;
  // onActualSize?: () => void;
}

export const ImageViewControls: React.FC<ImageViewControlsProps> = ({
  // zoomLevel,
  // onZoomChange,
  // onFitToScreen,
  // onActualSize,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          {/* Placeholder for zoom controls */}
          <div className="text-sm text-gray-400">
            Zoom controls will be added here
          </div>
        </div>
      </div>
    </div>
  );
};