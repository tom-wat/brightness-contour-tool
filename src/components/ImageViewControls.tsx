import React from 'react';

interface ImageViewControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: (customContainerWidth?: number, customContainerHeight?: number) => void;
  onActualSize: () => void;
}

export const ImageViewControls: React.FC<ImageViewControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onActualSize,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          {/* Zoom Level Display */}
          <div className="text-sm text-gray-600 font-medium">
            {Math.round(zoomLevel * 100)}%
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onZoomOut}
              className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
              title="Zoom Out"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <button
              onClick={onZoomIn}
              className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
              title="Zoom In"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Preset Zoom Controls */}
          <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
            <button
              onClick={() => onFitToScreen()}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
              title="Fit to Screen"
            >
              Fit
            </button>
            
            <button
              onClick={onActualSize}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
              title="Actual Size (100%)"
            >
              100%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};