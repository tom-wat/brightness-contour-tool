import React, { useRef, useEffect, forwardRef } from 'react';
import { CornersOut, Minus, Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useCanvasRenderer } from '@/hooks/useCanvasRenderer';
import { BrightnessData, ContourSettings } from '@/types/ImageTypes';
import { DisplayOptions } from '@/types/UITypes';
import { FrequencyData } from '@/types/FrequencyTypes';

interface ImageCanvasProps {
  originalImageData: ImageData;
  brightnessData: BrightnessData | null;
  displayOptions: DisplayOptions;
  contourSettings: ContourSettings;
  filteredImageData?: ImageData | null;
  imageFilterOpacity?: number;
  denoisedImageData?: ImageData | null;
  denoiseOpacity?: number;
  frequencyData?: FrequencyData | null;
  transform?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: () => void;
  onWheel?: (e: React.WheelEvent) => void;
  onContainerResize?: (width: number, height: number) => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: (w?: number, h?: number) => void;
  onActualSize?: () => void;
  onNativeTouchStart?: (e: TouchEvent) => void;
  onNativeTouchMove?: (e: TouchEvent, rect: DOMRect) => void;
  onNativeTouchEnd?: (e: TouchEvent) => void;
  exportPreviewUrl?: string | null;
}

export const ImageCanvas = forwardRef<HTMLCanvasElement, ImageCanvasProps>(function ImageCanvas({
  originalImageData,
  brightnessData,
  displayOptions,
  contourSettings,
  filteredImageData,
  imageFilterOpacity = 100,
  denoisedImageData,
  denoiseOpacity = 100,
  frequencyData,
  transform,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onContainerResize,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onActualSize,
  onNativeTouchStart,
  onNativeTouchMove,
  onNativeTouchEnd,
  exportPreviewUrl,
}, ref) {
  const { canvasRef, renderWithLayers } = useCanvasRenderer();
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);

  // 外部からのrefと内部のrefを同期。アンマウント後も外部refが外れたcanvas
  // （前の画像が描かれたまま）を指し続けないよう、必ず null に戻す
  useEffect(() => {
    if (!ref || typeof ref !== 'object') return;
    ref.current = canvasRef.current;
    return () => {
      ref.current = null;
    };
  }, [ref, canvasRef]);

  useEffect(() => {
    renderWithLayers(
      originalImageData,
      brightnessData,
      displayOptions,
      contourSettings,
      {
        filteredImageData,
        imageFilterOpacity,
        denoisedImageData,
        denoiseOpacity,
        frequencyData,
      }
    );
  }, [originalImageData, brightnessData, displayOptions, contourSettings, filteredImageData, imageFilterOpacity, denoisedImageData, denoiseOpacity, frequencyData, renderWithLayers]);

  // ズーム・パンは毎フレーム変わる動的な値なので、JSX ではなく style に直接代入する。
  // -50% の平行移動でキャンバスをコンテナ中央に置いてから拡大・平行移動する。
  useEffect(() => {
    const value = `translate(-50%, -50%) ${transform ?? ''}`.trimEnd();
    if (canvasRef.current) canvasRef.current.style.transform = value;
    if (previewRef.current) previewRef.current.style.transform = value;
  }, [transform, exportPreviewUrl, canvasRef]);

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

  // Touch event listeners (non-passive for preventDefault)
  useEffect(() => {
    if (!containerRef.current) return;
    if (!onNativeTouchStart && !onNativeTouchMove && !onNativeTouchEnd) return;

    const container = containerRef.current;

    const touchStartHandler = (e: TouchEvent) => onNativeTouchStart?.(e);
    const touchMoveHandler = (e: TouchEvent) => {
      onNativeTouchMove?.(e, container.getBoundingClientRect());
    };
    const touchEndHandler = (e: TouchEvent) => onNativeTouchEnd?.(e);

    container.addEventListener('touchstart', touchStartHandler, { passive: false });
    container.addEventListener('touchmove', touchMoveHandler, { passive: false });
    container.addEventListener('touchend', touchEndHandler);

    return () => {
      container.removeEventListener('touchstart', touchStartHandler);
      container.removeEventListener('touchmove', touchMoveHandler);
      container.removeEventListener('touchend', touchEndHandler);
    };
  }, [onNativeTouchStart, onNativeTouchMove, onNativeTouchEnd]);

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
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-muted"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <canvas ref={canvasRef} className="absolute top-1/2 left-1/2 origin-center" />
      {exportPreviewUrl && (
        <img
          ref={previewRef}
          src={exportPreviewUrl}
          alt=""
          className="pointer-events-none absolute top-1/2 left-1/2 max-w-none origin-center"
        />
      )}
      {onZoomIn && onZoomOut && (
        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-md border bg-background/90 p-1 shadow-sm backdrop-blur">
          <Button variant="ghost" size="icon-sm" onClick={onZoomOut} aria-label="Zoom out">
            <Minus />
          </Button>
          {/* flow-finder shows a plain readout here; this one doubles as the
              100% button so actual size stays reachable. */}
          <Button
            variant="ghost"
            size="sm"
            className="w-12 text-xs tabular-nums text-muted-foreground"
            onClick={onActualSize}
            disabled={!onActualSize}
            aria-label="Actual size"
            title="Actual size (100%)"
          >
            {Math.round((zoomLevel ?? 1) * 100)}%
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onZoomIn} aria-label="Zoom in">
            <Plus />
          </Button>
          {onFitToScreen && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onFitToScreen()}
              aria-label="Fit to screen"
            >
              <CornersOut />
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
