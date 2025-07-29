import { useState, useCallback, useRef } from 'react';

export interface ZoomPanState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface UseZoomPanReturn {
  zoomPanState: ZoomPanState;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (zoom: number) => void;
  resetZoom: () => void;
  fitToScreen: (customContainerWidth?: number, customContainerHeight?: number) => void;
  actualSize: () => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  getTransform: () => string;
}

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5.0;
const ZOOM_STEP = 0.2;

export const useZoomPan = (
  containerWidth?: number,
  containerHeight?: number,
  imageWidth?: number,
  imageHeight?: number
): UseZoomPanReturn => {
  const [zoomPanState, setZoomPanState] = useState<ZoomPanState>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setZoomPanState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + ZOOM_STEP, ZOOM_MAX),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomPanState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - ZOOM_STEP, ZOOM_MIN),
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setZoomPanState(prev => ({
      ...prev,
      zoom: Math.max(ZOOM_MIN, Math.min(zoom, ZOOM_MAX)),
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomPanState({
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  }, []);

  const fitToScreen = useCallback((
    customContainerWidth?: number,
    customContainerHeight?: number
  ) => {
    const cWidth = customContainerWidth || containerWidth;
    const cHeight = customContainerHeight || containerHeight;
    
    if (!cWidth || !cHeight || !imageWidth || !imageHeight) return;

    const scaleX = cWidth / imageWidth;
    const scaleY = cHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    setZoomPanState({
      zoom: scale,
      panX: 0,
      panY: 0,
    });
  }, [containerWidth, containerHeight, imageWidth, imageHeight]);

  const actualSize = useCallback(() => {
    setZoomPanState(prev => ({
      ...prev,
      zoom: 1,
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    setZoomPanState(prev => ({
      ...prev,
      panX: prev.panX + deltaX,
      panY: prev.panY + deltaY,
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ホイールズーム機能を無効化（ブラウザのスクロール機能と競合するため）
  const handleWheel = useCallback(() => {
    // 何もしない - ブラウザのデフォルトスクロール動作を維持
  }, []);

  const getTransform = useCallback(() => {
    const { zoom, panX, panY } = zoomPanState;
    return `translate(${panX}px, ${panY}px) scale(${zoom})`;
  }, [zoomPanState]);

  return {
    zoomPanState,
    zoomIn,
    zoomOut,
    setZoom,
    resetZoom,
    fitToScreen,
    actualSize,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    getTransform,
  };
};