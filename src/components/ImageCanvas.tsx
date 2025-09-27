import React, { useRef, useEffect, forwardRef } from 'react';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { BrightnessData, ContourSettings } from '../types/ImageTypes';
import { DisplayMode, DisplayOptions } from '../types/UITypes';
import { FrequencyData, FrequencySettings } from '../types/FrequencyTypes';

interface ImageCanvasProps {
  originalImageData: ImageData;
  brightnessData: BrightnessData | null;
  displayMode?: DisplayMode;
  displayOptions?: DisplayOptions;
  contourSettings: ContourSettings;
  filteredImageData?: ImageData | null;
  imageFilterOpacity?: number;
  frequencyData?: FrequencyData | null;
  frequencySettings?: FrequencySettings;
  transform?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: () => void;
  onWheel?: (e: React.WheelEvent) => void;
  onContainerResize?: (width: number, height: number) => void;
}

export const ImageCanvas = forwardRef<HTMLCanvasElement, ImageCanvasProps>(({
  originalImageData,
  brightnessData,
  displayMode,
  displayOptions,
  contourSettings,
  filteredImageData,
  imageFilterOpacity = 100,
  frequencyData,
  frequencySettings,
  transform,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onContainerResize,
}, ref) => {
  const { canvasRef, renderImage, renderWithLayers } = useCanvasRenderer();
  const containerRef = useRef<HTMLDivElement>(null);

  // 外部からのrefと内部のrefを同期
  useEffect(() => {
    if (ref && typeof ref === 'object' && canvasRef.current) {
      ref.current = canvasRef.current;
    }
  }, [ref, canvasRef]);

  useEffect(() => {
    if (displayOptions) {
      // 新しいレイヤーベースの表示
      renderWithLayers(
        originalImageData,
        brightnessData,
        filteredImageData || null,
        displayOptions,
        contourSettings,
        imageFilterOpacity,
        frequencyData
      );
    } else if (displayMode) {
      // 従来のdisplayModeベースの表示（後方互換性）
      renderImage(originalImageData, brightnessData, displayMode, contourSettings, filteredImageData, imageFilterOpacity);
    }
  }, [originalImageData, brightnessData, displayMode, displayOptions, contourSettings, filteredImageData, imageFilterOpacity, frequencyData, frequencySettings, renderImage, renderWithLayers]);

  // コンテナサイズ変更を監視
  useEffect(() => {
    if (!containerRef.current || !onContainerResize) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        onContainerResize(width, height);
      }
    });

    resizeObserver.observe(containerRef.current);

    // 初回サイズ通知
    const rect = containerRef.current.getBoundingClientRect();
    onContainerResize(rect.width, rect.height);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onContainerResize]);

  // Wheel event listener with non-passive option
  useEffect(() => {
    if (!containerRef.current || !onWheel) return;

    const container = containerRef.current;

    const handleWheelEvent = (e: WheelEvent) => {
      // Prevent default browser wheel behavior
      e.preventDefault();

      // Create a minimal synthetic React wheel event
      const syntheticEvent = {
        currentTarget: container,
        target: e.target,
        clientX: e.clientX,
        clientY: e.clientY,
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaZ: e.deltaZ,
        deltaMode: e.deltaMode,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
        nativeEvent: e,
        isDefaultPrevented: () => e.defaultPrevented,
        isPropagationStopped: () => false,
        persist: () => {},
      } as unknown as React.WheelEvent;

      onWheel(syntheticEvent);
    };

    // Add non-passive wheel event listener
    container.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [onWheel]);

  return (
    <div className="flex justify-center p-6">
      <div 
        ref={containerRef}
        className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
        style={{ 
          height: 'min(78vh, 800px)', 
          minHeight: '400px',
          width: '100%',
          maxWidth: '1200px'
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <canvas
          ref={canvasRef}
          className="absolute touch-none"
          style={{ 
            cursor: onMouseDown ? 'grab' : 'default',
            transform: transform || 'none',
            transformOrigin: 'center center',
            transition: transform ? 'none' : 'transform 0.2s ease-out',
            top: '50%',
            left: '50%',
            translate: '-50% -50%'
          }}
        />
      </div>
    </div>
  );
});