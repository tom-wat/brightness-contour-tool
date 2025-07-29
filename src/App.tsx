import { useState, useCallback, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageCanvas } from './components/ImageCanvas';
import { ImageViewControls } from './components/ImageViewControls';
import { DisplaySettings } from './components/DisplaySettings';
import { ContourControls } from './components/ContourControls';
import { CannyControls } from './components/CannyControls';
import { EdgeProcessingControls } from './components/EdgeProcessingControls';
import { useBrightnessAnalysis } from './hooks/useBrightnessAnalysis';
import { useCannyDetection } from './hooks/useCannyDetection';
import { useZoomPan } from './hooks/useZoomPan';
import { useEdgeProcessing } from './hooks/useEdgeProcessing';
import { useImageExport } from './hooks/useImageExport';
import { ImageUploadResult, ContourSettings, DEFAULT_CONTOUR_LEVELS } from './types/ImageTypes';
import { CannyParams, DEFAULT_CANNY_PARAMS } from './types/CannyTypes';
import { DisplayMode, DEFAULT_APP_SETTINGS } from './types/UITypes';
import { EdgeProcessingSettings, DEFAULT_EDGE_PROCESSING_SETTINGS } from './types/EdgeProcessingTypes';
import { ExportSettings } from './hooks/useImageExport';

function App() {
  const [uploadedImage, setUploadedImage] = useState<ImageUploadResult | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DEFAULT_APP_SETTINGS.displayMode);
  const [contourSettings, setContourSettings] = useState<ContourSettings>({
    levels: DEFAULT_CONTOUR_LEVELS,
    transparency: 80,
    gaussianBlur: 0,
  });
  const [cannyParams, setCannyParams] = useState<CannyParams>(DEFAULT_CANNY_PARAMS);
  const [cannyOpacity, setCannyOpacity] = useState(80);
  const [edgeProcessingSettings, setEdgeProcessingSettings] = useState<EdgeProcessingSettings>(DEFAULT_EDGE_PROCESSING_SETTINGS);
  const [processedEdgeData, setProcessedEdgeData] = useState<ImageData | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [shouldAutoFit, setShouldAutoFit] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { brightnessData, analyzeBrightness } = useBrightnessAnalysis();
  const { edgeData, detectEdges, calculateOptimalThresholds, openCVLoaded } = useCannyDetection();
  const { processEdges } = useEdgeProcessing();
  const { exportCurrentView } = useImageExport();
  
  // ズーム・パン機能
  const {
    zoomPanState,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    actualSize,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getTransform,
  } = useZoomPan(
    containerSize?.width,
    containerSize?.height,
    uploadedImage?.width,
    uploadedImage?.height
  );

  const handleImageUpload = useCallback((result: ImageUploadResult) => {
    setUploadedImage(result);
    analyzeBrightness(result.originalImageData, contourSettings);
    detectEdges(result.originalImageData, cannyParams);
    
    // ズーム・パン状態をリセット
    resetZoom();
    // 自動フィット有効化
    setShouldAutoFit(true);
  }, [analyzeBrightness, contourSettings, detectEdges, cannyParams, resetZoom]);

  const handleContainerResize = useCallback((width: number, height: number) => {
    // コンテナサイズを保存
    setContainerSize({ width, height });
    
    // 自動フィットが有効で画像が読み込まれている場合のみ実行
    if (shouldAutoFit && uploadedImage) {
      // 少し遅延を入れてDOMが安定してからフィット実行
      setTimeout(() => {
        fitToScreen(width, height);
        // 自動フィット無効化（一度だけ実行）
        setShouldAutoFit(false);
      }, 50);
    }
  }, [shouldAutoFit, uploadedImage, fitToScreen]);

  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
    // Cannyエッジ検出モードが選択されている場合、エッジデータが必要
    const cannyModes = [
      DisplayMode.CANNY_EDGE_ONLY,
      DisplayMode.COLOR_WITH_CANNY,
      DisplayMode.CONTOUR_WITH_CANNY,
      DisplayMode.GRAYSCALE_WITH_CONTOUR_AND_CANNY,
      DisplayMode.COLOR_WITH_CONTOUR_AND_CANNY,
    ];
    if (cannyModes.includes(mode) && uploadedImage && !edgeData) {
      detectEdges(uploadedImage.originalImageData, cannyParams);
    }
  }, [uploadedImage, edgeData, cannyParams, detectEdges]);

  const handleContourSettingsChange = useCallback((settings: ContourSettings) => {
    setContourSettings(settings);
    if (uploadedImage) {
      analyzeBrightness(uploadedImage.originalImageData, settings);
    }
  }, [uploadedImage, analyzeBrightness]);

  const handleCannyParamsChange = useCallback((params: CannyParams) => {
    setCannyParams(params);
    if (uploadedImage) {
      detectEdges(uploadedImage.originalImageData, params);
      // エッジデータが更新されるので、後処理データもリセット
      setProcessedEdgeData(null);
    }
  }, [uploadedImage, detectEdges]);

  const handleCannyOpacityChange = useCallback((opacity: number) => {
    setCannyOpacity(opacity);
  }, []);

  const handleEdgeProcessingSettingsChange = useCallback((settings: EdgeProcessingSettings) => {
    setEdgeProcessingSettings(settings);
    
    // エッジ後処理を実行
    if (edgeData) {
      // 非同期処理でUI をブロックしない
      setTimeout(() => {
        try {
          const result = processEdges(edgeData, settings);
          setProcessedEdgeData(result.processedEdgeData);
        } catch (error) {
          console.error('Edge processing failed:', error);
          setProcessedEdgeData(edgeData); // フォールバック
        }
      }, 0);
    }
  }, [edgeData, processEdges]);

  const handleAutoDetectThresholds = useCallback(() => {
    if (uploadedImage) {
      const optimalThresholds = calculateOptimalThresholds(uploadedImage.originalImageData);
      const newParams = { ...cannyParams, ...optimalThresholds };
      setCannyParams(newParams);
      detectEdges(uploadedImage.originalImageData, newParams);
      // エッジデータが更新されるので、後処理データもリセット
      setProcessedEdgeData(null);
    }
  }, [uploadedImage, cannyParams, calculateOptimalThresholds, detectEdges]);

  const handleExport = useCallback(async (settings: ExportSettings) => {
    if (!uploadedImage || !canvasRef.current) return;

    setIsExporting(true);
    
    try {
      const metadata = {
        timestamp: new Date().toISOString(),
        displayMode,
        contourSettings,
        cannyParams: edgeData ? cannyParams : undefined,
        edgeProcessingSettings: processedEdgeData ? edgeProcessingSettings : undefined,
        cannyOpacity: edgeData ? cannyOpacity : undefined,
        imageSize: {
          width: uploadedImage.width,
          height: uploadedImage.height,
        },
      };

      await exportCurrentView(
        { current: canvasRef.current },
        settings,
        metadata
      );
    } catch (error) {
      console.error('Export failed:', error);
      // エラー通知は後で実装
    } finally {
      setIsExporting(false);
    }
  }, [
    uploadedImage,
    displayMode,
    contourSettings,
    cannyParams,
    edgeProcessingSettings,
    cannyOpacity,
    edgeData,
    processedEdgeData,
    exportCurrentView,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Brightness Contour
          </h1>
          {uploadedImage && (
            <button
              onClick={() => setUploadedImage(null)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded border border-gray-300 transition-colors duration-200"
            >
              Select Another Image
            </button>
          )}
        </div>
      </header>

      {!uploadedImage ? (
        <main className="w-full">
          <ImageUploader onImageUpload={handleImageUpload} />
        </main>
      ) : (
        <main>
          <div className="flex h-[calc(100vh-73px)]">
            {/* Left Sidebar - Controls */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <ContourControls
                  contourSettings={contourSettings}
                  onContourSettingsChange={handleContourSettingsChange}
                />
                <CannyControls
                  cannyParams={cannyParams}
                  cannyOpacity={cannyOpacity}
                  onCannyParamsChange={handleCannyParamsChange}
                  onCannyOpacityChange={handleCannyOpacityChange}
                  onAutoDetectThresholds={handleAutoDetectThresholds}
                  openCVLoaded={openCVLoaded}
                />
                <EdgeProcessingControls
                  settings={edgeProcessingSettings}
                  onSettingsChange={handleEdgeProcessingSettingsChange}
                />
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50 flex flex-col">
              {/* Image View Controls */}
              <div className="sticky top-0 z-10">
                <ImageViewControls
                  zoomLevel={zoomPanState.zoom}
                  onZoomIn={zoomIn}
                  onZoomOut={zoomOut}
                  onFitToScreen={fitToScreen}
                  onActualSize={actualSize}
                />
              </div>
              
              {/* Canvas Area */}
              <div className="flex-1">
                <ImageCanvas
                  ref={canvasRef}
                  originalImageData={uploadedImage.originalImageData}
                  brightnessData={brightnessData}
                  edgeData={processedEdgeData || edgeData}
                  displayMode={displayMode}
                  contourSettings={contourSettings}
                  cannyOpacity={cannyOpacity}
                  transform={getTransform()}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onContainerResize={handleContainerResize}
                />
              </div>
            </div>

            {/* Right Sidebar - Display Settings */}
            <DisplaySettings
              displayMode={displayMode}
              onDisplayModeChange={handleDisplayModeChange}
              onExport={handleExport}
              isExporting={isExporting}
            />
          </div>
        </main>
      )}
    </div>
  );
}

export default App;