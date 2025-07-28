import React from 'react';
import { CannyParams, CANNY_THRESHOLD_RANGES } from '../types/CannyTypes';

interface CannyControlsProps {
  cannyParams: CannyParams;
  onCannyParamsChange: (params: CannyParams) => void;
  onAutoDetectThresholds: () => void;
}

export const CannyControls: React.FC<CannyControlsProps> = ({
  cannyParams,
  onCannyParamsChange,
  onAutoDetectThresholds,
}) => {
  const handleLowThresholdChange = (lowThreshold: number) => {
    onCannyParamsChange({ ...cannyParams, lowThreshold });
  };

  const handleHighThresholdChange = (highThreshold: number) => {
    onCannyParamsChange({ ...cannyParams, highThreshold });
  };

  return (
    <div className="border-t border-slate-200 p-6 mt-6">
      <h3 className="text-md font-semibold text-slate-900 mb-4">Canny Edge Detection</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Auto-detect optimal thresholds</span>
          <button
            onClick={onAutoDetectThresholds}
            className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200 transition-colors duration-200"
          >
            Auto
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Low Threshold: {cannyParams.lowThreshold}
          </label>
          <input
            type="range"
            min={CANNY_THRESHOLD_RANGES.lowMin}
            max={CANNY_THRESHOLD_RANGES.lowMax}
            step="5"
            value={cannyParams.lowThreshold}
            onChange={(e) => handleLowThresholdChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{CANNY_THRESHOLD_RANGES.lowMin}</span>
            <span>{CANNY_THRESHOLD_RANGES.lowMax}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            High Threshold: {cannyParams.highThreshold}
          </label>
          <input
            type="range"
            min={CANNY_THRESHOLD_RANGES.highMin}
            max={CANNY_THRESHOLD_RANGES.highMax}
            step="10"
            value={cannyParams.highThreshold}
            onChange={(e) => handleHighThresholdChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{CANNY_THRESHOLD_RANGES.highMin}</span>
            <span>{CANNY_THRESHOLD_RANGES.highMax}</span>
          </div>
        </div>
      </div>
    </div>
  );
};