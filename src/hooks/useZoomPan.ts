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
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent, containerRect: DOMRect) => void;
  handleTouchEnd: (e: TouchEvent) => void;
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
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const lastPinchDistance = useRef<number | null>(null);

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

    const verticalPadding = 32; // 上下各16pxの余白
    const scaleX = cWidth / imageWidth;
    const scaleY = (cHeight - verticalPadding) / imageHeight;
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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(ZOOM_MIN, Math.min(zoomPanState.zoom * zoomFactor, ZOOM_MAX));
    
    if (newZoom === zoomPanState.zoom) return; // ズームが変更されない場合は何もしない
    
    // コンテナ内でのマウス位置を取得
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // コンテナの中心座標
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;
    
    // 現在のズーム状態でのマウス位置（画像座標系での位置）
    // transform-origin: center center を考慮した計算
    const currentImageCenterX = containerCenterX + zoomPanState.panX;
    const currentImageCenterY = containerCenterY + zoomPanState.panY;
    
    // マウス位置から画像中心への相対位置
    const relativeMouseX = mouseX - currentImageCenterX;
    const relativeMouseY = mouseY - currentImageCenterY;
    
    // ズーム前後での画像中心位置の変化量を計算
    const scaleDiff = newZoom / zoomPanState.zoom;
    const newRelativeMouseX = relativeMouseX * scaleDiff;
    const newRelativeMouseY = relativeMouseY * scaleDiff;
    
    // 新しいパン位置を計算（マウス位置が固定されるように）
    const newPanX = zoomPanState.panX + (relativeMouseX - newRelativeMouseX);
    const newPanY = zoomPanState.panY + (relativeMouseY - newRelativeMouseY);
    
    setZoomPanState({
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY,
    });
  }, [zoomPanState]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    if (e.touches.length === 1 && t0) {
      lastTouchPos.current = { x: t0.clientX, y: t0.clientY };
      lastPinchDistance.current = null;
    } else if (e.touches.length === 2 && t0 && t1) {
      lastPinchDistance.current = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      lastTouchPos.current = {
        x: (t0.clientX + t1.clientX) / 2,
        y: (t0.clientY + t1.clientY) / 2,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent, containerRect: DOMRect) => {
    e.preventDefault();
    const t0 = e.touches[0];
    const t1 = e.touches[1];

    if (e.touches.length === 1 && t0 && lastPinchDistance.current === null) {
      // 1本指パン
      const deltaX = t0.clientX - lastTouchPos.current.x;
      const deltaY = t0.clientY - lastTouchPos.current.y;
      setZoomPanState(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY,
      }));
      lastTouchPos.current = { x: t0.clientX, y: t0.clientY };
    } else if (e.touches.length === 2 && t0 && t1) {
      // 2本指ピンチズーム
      const distance = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;

      if (lastPinchDistance.current !== null) {
        const rawRatio = distance / lastPinchDistance.current;
        const PINCH_SENSITIVITY = 1.8;
        const ratio = 1 + (rawRatio - 1) * PINCH_SENSITIVITY;
        setZoomPanState(prev => {
          const newZoom = Math.max(ZOOM_MIN, Math.min(prev.zoom * ratio, ZOOM_MAX));
          const scaleDiff = newZoom / prev.zoom;

          const localMidX = midX - containerRect.left;
          const localMidY = midY - containerRect.top;
          const containerCenterX = containerRect.width / 2;
          const containerCenterY = containerRect.height / 2;
          const relX = localMidX - (containerCenterX + prev.panX);
          const relY = localMidY - (containerCenterY + prev.panY);
          const panDeltaX = midX - lastTouchPos.current.x;
          const panDeltaY = midY - lastTouchPos.current.y;

          return {
            zoom: newZoom,
            panX: prev.panX + relX * (1 - scaleDiff) + panDeltaX,
            panY: prev.panY + relY * (1 - scaleDiff) + panDeltaY,
          };
        });
      }

      lastPinchDistance.current = distance;
      lastTouchPos.current = { x: midX, y: midY };
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const t0 = e.touches[0];
    if (e.touches.length < 2) {
      lastPinchDistance.current = null;
    }
    if (e.touches.length === 1 && t0) {
      lastTouchPos.current = { x: t0.clientX, y: t0.clientY };
    }
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
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getTransform,
  };
};