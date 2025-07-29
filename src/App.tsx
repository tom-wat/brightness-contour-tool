import { useState, useCallback, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageCanvas } from './components/ImageCanvas';
import { ImageViewControls } from './components/ImageViewControls';
import { DisplaySettings } from './components/DisplaySettings';
import { ContourControls } from './components/ContourControls';
import { CannyControls } from './components/CannyControls';
import { EdgeProcessingControls } from './components/EdgeProcessingControls';
import { NoiseReductionControls } from './components/NoiseReductionControls';
import { useBrightnessAnalysis } from './hooks/useBrightnessAnalysis';
import { useCannyDetection } from './hooks/useCannyDetection';
import { useNoiseReduction } from './hooks/useNoiseReduction';
import { useZoomPan } from './hooks/useZoomPan';
import { useEdgeProcessing } from './hooks/useEdgeProcessing';
import { useImageExport } from './hooks/useImageExport';
import { SettingsStorage } from './hooks/useLocalStorage';
import { ImageUploadResult, ContourSettings, DEFAULT_CONTOUR_LEVELS } from './types/ImageTypes';
import { CannyParams, DEFAULT_CANNY_PARAMS } from './types/CannyTypes';
import { DisplayMode, DEFAULT_APP_SETTINGS } from './types/UITypes';
import { EdgeProcessingSettings, DEFAULT_EDGE_PROCESSING_SETTINGS } from './types/EdgeProcessingTypes';
import { ExportSettings } from './hooks/useImageExport';

function App() {
  const [uploadedImage, setUploadedImage] = useState<ImageUploadResult | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => 
    SettingsStorage.getDisplayMode(DEFAULT_APP_SETTINGS.displayMode)
  );
  const [contourSettings, setContourSettings] = useState<ContourSettings>(() => 
    SettingsStorage.getContourSettings({
      levels: DEFAULT_CONTOUR_LEVELS,
      transparency: 80,
      gaussianBlur: 0,
    })
  );
  const [cannyParams, setCannyParams] = useState<CannyParams>(() => 
    SettingsStorage.getCannyParams(DEFAULT_CANNY_PARAMS)
  );
  const [cannyOpacity, setCannyOpacity] = useState(() => 
    SettingsStorage.getCannyOpacity(80)
  );
  const [edgeProcessingSettings, setEdgeProcessingSettings] = useState<EdgeProcessingSettings>(() => 
    SettingsStorage.getEdgeProcessingSettings(DEFAULT_EDGE_PROCESSING_SETTINGS)
  );
  const [processedEdgeData, setProcessedEdgeData] = useState<ImageData | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [shouldAutoFit, setShouldAutoFit] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { brightnessData, analyzeBrightness } = useBrightnessAnalysis();
  const { edgeData, detectEdges, calculateOptimalThresholds, openCVLoaded } = useCannyDetection();
  const { processEdges } = useEdgeProcessing();
  const { settings: noiseReductionSettings, result: noiseReductionResult, processImage: processNoiseReduction, updateSettings: updateNoiseReductionSettings, clearResult: clearNoiseReductionResult } = useNoiseReduction();
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
    SettingsStorage.saveDisplayMode(mode);
    // Cannyエッジ検出モードが選択されている場合、エッジデータが必要
    const cannyModes = [
      DisplayMode.CANNY_EDGE_ONLY,
      DisplayMode.COLOR_WITH_CANNY,
      DisplayMode.CONTOUR_WITH_CANNY,
      DisplayMode.GRAYSCALE_WITH_CONTOUR_AND_CANNY,
      DisplayMode.COLOR_WITH_CONTOUR_AND_CANNY,
      DisplayMode.DENOISED_WITH_CANNY,
      DisplayMode.ALL_WITH_DENOISING,
    ];
    
    const noiseReductionModes = [
      DisplayMode.DENOISED_ONLY,
      DisplayMode.DENOISED_GRAYSCALE_ONLY,
      DisplayMode.DENOISED_CONTOUR_ONLY,
      DisplayMode.COLOR_WITH_DENOISED_CONTOUR,
      DisplayMode.GRAYSCALE_WITH_DENOISED_CONTOUR,
      DisplayMode.DENOISED_WITH_CANNY,
      DisplayMode.ALL_WITH_DENOISING,
      DisplayMode.ALL_WITH_DENOISING_GRAYSCALE,
    ];
    if (cannyModes.includes(mode) && uploadedImage && !edgeData) {
      detectEdges(uploadedImage.originalImageData, cannyParams);
    }
    
    // ノイズ除去モードが選択されている場合、適用済み（enabled=true）の場合は処理を実行
    if (noiseReductionModes.includes(mode) && uploadedImage && noiseReductionSettings.enabled && !noiseReductionResult.denoisedImageData) {
      processNoiseReduction(uploadedImage.originalImageData);
    }
  }, [uploadedImage, edgeData, cannyParams, detectEdges, noiseReductionSettings.enabled, noiseReductionResult.denoisedImageData, processNoiseReduction]);

  const handleContourSettingsChange = useCallback((settings: ContourSettings) => {
    setContourSettings(settings);
    SettingsStorage.saveContourSettings(settings);
    if (uploadedImage) {
      analyzeBrightness(uploadedImage.originalImageData, settings);
    }
  }, [uploadedImage, analyzeBrightness]);

  const handleCannyParamsChange = useCallback((params: CannyParams) => {
    setCannyParams(params);
    SettingsStorage.saveCannyParams(params);
    if (uploadedImage) {
      detectEdges(uploadedImage.originalImageData, params);
      // エッジデータが更新されるので、後処理データもリセット
      setProcessedEdgeData(null);
    }
  }, [uploadedImage, detectEdges]);

  const handleCannyOpacityChange = useCallback((opacity: number) => {
    setCannyOpacity(opacity);
    SettingsStorage.saveCannyOpacity(opacity);
  }, []);

  const handleEdgeProcessingSettingsChange = useCallback((settings: EdgeProcessingSettings) => {
    setEdgeProcessingSettings(settings);
    SettingsStorage.saveEdgeProcessingSettings(settings);
    
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

  const handleNoiseReductionSettingsChange = useCallback((settings: Partial<typeof noiseReductionSettings>) => {
    console.log('Noise reduction settings changed:', settings);
    updateNoiseReductionSettings(settings);
    
    // 設定変更時、画像が存在し、有効化されている場合は自動的に処理を実行
    if (uploadedImage) {
      // enabledがfalseに設定された場合は結果をクリア
      if (settings.enabled === false) {
        console.log('Disabling noise reduction');
        clearNoiseReductionResult();
        return;
      }
      
      // enabled状態で設定が変更された場合、または今有効化された場合
      if (settings.enabled === true || (noiseReductionSettings.enabled && settings.enabled !== false)) {
        console.log('Auto-applying noise reduction');
        processNoiseReduction(uploadedImage.originalImageData);
      }
    }
  }, [uploadedImage, updateNoiseReductionSettings, processNoiseReduction, clearNoiseReductionResult, noiseReductionSettings.enabled]);

  const handleAutoDetectThresholds = useCallback(() => {
    if (uploadedImage) {
      const optimalThresholds = calculateOptimalThresholds(uploadedImage.originalImageData);
      const newParams = { ...cannyParams, ...optimalThresholds };
      setCannyParams(newParams);
      SettingsStorage.saveCannyParams(newParams);
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
          <div className="flex h-[calc(100vh-87px)]">
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
                <NoiseReductionControls
                  settings={noiseReductionSettings}
                  onSettingsChange={handleNoiseReductionSettingsChange}
                  processing={noiseReductionResult.processing}
                  processingTime={noiseReductionResult.processingTime}
                  error={noiseReductionResult.error}
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
                  denoisedImageData={noiseReductionResult.denoisedImageData}
                  noiseReductionOpacity={noiseReductionSettings.opacity * 100}
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