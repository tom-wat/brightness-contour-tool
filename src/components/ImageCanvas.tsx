import React from 'react';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { BrightnessData, ContourSettings } from '../types/ImageTypes';
import { DisplayMode } from '../types/UITypes';

interface ImageCanvasProps {
  originalImageData: ImageData;
  brightnessData: BrightnessData | null;
  edgeData: ImageData | null;
  displayMode: DisplayMode;
  contourSettings: ContourSettings;
  cannyOpacity: number;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  originalImageData,
  brightnessData,
  edgeData,
  displayMode,
  contourSettings,
  cannyOpacity,
}) => {
  const { canvasRef, renderImage } = useCanvasRenderer();

  React.useEffect(() => {
    renderImage(originalImageData, brightnessData, edgeData, displayMode, contourSettings, cannyOpacity);
  }, [originalImageData, brightnessData, edgeData, displayMode, contourSettings, cannyOpacity, renderImage]);

  return (
    <div className="flex justify-center p-6">
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg max-w-full"
      />
    </div>
  );
};