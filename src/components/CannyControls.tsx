import React from 'react';
import { CannyParams, CANNY_THRESHOLD_RANGES } from '../types/CannyTypes';

interface CannyControlsProps {
  cannyParams: CannyParams;
  cannyOpacity: number;
  onCannyParamsChange: (params: CannyParams) => void;
  onCannyOpacityChange: (opacity: number) => void;
  onAutoDetectThresholds: () => void;
  openCVLoaded: boolean;
}

export const CannyControls: React.FC<CannyControlsProps> = ({
  cannyParams,
  cannyOpacity,
  onCannyParamsChange,
  onCannyOpacityChange,
  onAutoDetectThresholds,
  openCVLoaded,
}) => {
  const handleLowThresholdChange = (lowThreshold: number) => {
    onCannyParamsChange({ ...cannyParams, lowThreshold });
  };

  const handleHighThresholdChange = (highThreshold: number) => {
    onCannyParamsChange({ ...cannyParams, highThreshold });
  };

  return (
    <div className="p-6">
      <h3 className="text-md font-semibold text-gray-900 mb-4">Canny Edge Detection</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Auto-detect optimal thresholds</span>
          <button
            onClick={onAutoDetectThresholds}
            disabled={!openCVLoaded}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Auto
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Low Threshold: {cannyParams.lowThreshold}
          </label>
          <input
            type="range"
            min={CANNY_THRESHOLD_RANGES.lowMin}
            max={CANNY_THRESHOLD_RANGES.lowMax}
            step="5"
            value={cannyParams.lowThreshold}
            onChange={(e) => handleLowThresholdChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{CANNY_THRESHOLD_RANGES.lowMin}</span>
            <span>{CANNY_THRESHOLD_RANGES.lowMax}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            High Threshold: {cannyParams.highThreshold}
          </label>
          <input
            type="range"
            min={CANNY_THRESHOLD_RANGES.highMin}
            max={CANNY_THRESHOLD_RANGES.highMax}
            step="10"
            value={cannyParams.highThreshold}
            onChange={(e) => handleHighThresholdChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{CANNY_THRESHOLD_RANGES.highMin}</span>
            <span>{CANNY_THRESHOLD_RANGES.highMax}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Edge Opacity: {cannyOpacity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={cannyOpacity}
            onChange={(e) => onCannyOpacityChange(parseInt(e.target.value))}
            disabled={!openCVLoaded}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed"
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