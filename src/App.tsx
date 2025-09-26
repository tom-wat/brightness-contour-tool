import { useState, useCallback, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageCanvas } from './components/ImageCanvas';
import { ImageViewControls } from './components/ImageViewControls';
import { DisplaySettings } from './components/DisplaySettings';
import { ContourControls } from './components/ContourControls';
import { CannyControls } from './components/CannyControls';
import { EdgeProcessingControls } from './components/EdgeProcessingControls';
import { ImageFilterControls } from './components/ImageFilterControls';
import { FrequencyControls } from './components/FrequencyControls';
import { useBrightnessAnalysis } from './hooks/useBrightnessAnalysis';
import { useCannyDetection } from './hooks/useCannyDetection';
import { useImageFilter } from './hooks/useImageFilter';
import { useZoomPan } from './hooks/useZoomPan';
import { useEdgeProcessing } from './hooks/useEdgeProcessing';
import { useImageExport } from './hooks/useImageExport';
import { useFrequencySeparation } from './hooks/useFrequencySeparation';
import { SettingsStorage } from './hooks/useLocalStorage';
import { ImageUploadResult, ContourSettings, DEFAULT_CONTOUR_LEVELS } from './types/ImageTypes';
import { CannyParams, DEFAULT_CANNY_PARAMS } from './types/CannyTypes';
import { DisplayOptions, DEFAULT_DISPLAY_OPTIONS } from './types/UITypes';
import { EdgeProcessingSettings, DEFAULT_EDGE_PROCESSING_SETTINGS } from './types/EdgeProcessingTypes';
import { ExportSettings } from './hooks/useImageExport';
import { FrequencySettings, DEFAULT_FREQUENCY_SETTINGS } from './types/FrequencyTypes';

function App() {
  const [uploadedImage, setUploadedImage] = useState<ImageUploadResult | null>(null);
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>(() =>
    SettingsStorage.getDisplayOptions(DEFAULT_DISPLAY_OPTIONS)
  );
  const [contourSettings, setContourSettings] = useState<ContourSettings>(() =>
    SettingsStorage.getContourSettings({
      levels: DEFAULT_CONTOUR_LEVELS,
      transparency: 80,
      minContourDistance: 0,
      brightnessThreshold: 65,
      contourContrast: 0,
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
  const [frequencySettings, setFrequencySettings] = useState<FrequencySettings>(
    DEFAULT_FREQUENCY_SETTINGS
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { brightnessData, analyzeBrightness, clearAnalysis } = useBrightnessAnalysis();
  const { edgeData, detectEdges, calculateOptimalThresholds, openCVLoaded, clearEdges } = useCannyDetection();
  const { processEdges } = useEdgeProcessing();
  const { settings: imageFilterSettings, result: imageFilterResult, processImage: processImageFilter, updateSettings: updateImageFilterSettings, clearResult: clearImageFilterResult } = useImageFilter();
  const { frequencyData, isProcessing: isFrequencyProcessing, processFrequencySeparation } = useFrequencySeparation();
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
    handleWheel,
    getTransform,
  } = useZoomPan(
    containerSize?.width,
    containerSize?.height,
    uploadedImage?.width,
    uploadedImage?.height
  );

  const handleImageUpload = useCallback((result: ImageUploadResult) => {
    // 新しい画像を設定
    setUploadedImage(result);
    
    // すべての処理結果をリセット
    clearAnalysis(); // 輝度解析結果をクリア
    clearEdges(); // エッジ検出結果をクリア
    clearImageFilterResult(); // 画像フィルタ結果をクリア
    setProcessedEdgeData(null); // エッジ後処理データをクリア
    
    // 新しい画像で処理を開始
    analyzeBrightness(result.originalImageData, contourSettings);
    detectEdges(result.originalImageData, cannyParams);

    // ズーム・パン状態をリセット
    resetZoom();
    // 自動フィット有効化
    setShouldAutoFit(true);
  }, [analyzeBrightness, contourSettings, detectEdges, cannyParams, resetZoom, clearAnalysis, clearEdges, clearImageFilterResult]);

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

  const handleDisplayOptionsChange = useCallback((options: DisplayOptions) => {
    setDisplayOptions(options);
    SettingsStorage.saveDisplayOptions(options);
  }, []);


  const handleContourSettingsChange = useCallback((settings: ContourSettings) => {
    console.log('🔧 ContourSettings changed:', settings);
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

  const handleFrequencySettingsChange = useCallback((settings: FrequencySettings) => {
    setFrequencySettings(settings);
    // SettingsStorage.saveFrequencySettings(settings); // TODO: Add to localStorage
  }, []);

  const handleFrequencyApply = useCallback(() => {
    if (uploadedImage?.originalImageData) {
      processFrequencySeparation(uploadedImage.originalImageData, frequencySettings);
    }
  }, [uploadedImage?.originalImageData, processFrequencySeparation, frequencySettings]);

  const handleImageFilterSettingsChange = useCallback((settings: Partial<typeof imageFilterSettings>) => {
    console.log('Image filter settings changed:', settings);
    updateImageFilterSettings(settings);
    
    // enabledがfalseに設定された場合は結果をクリア
    if (settings.enabled === false) {
      console.log('Disabling image filter');
      clearImageFilterResult();
    }
  }, [updateImageFilterSettings, clearImageFilterResult]);

  const handleApplyImageFilter = useCallback(() => {
    if (uploadedImage && imageFilterSettings.enabled) {
      console.log('Manually applying image filter');
      processImageFilter(uploadedImage.originalImageData);
    }
  }, [uploadedImage, imageFilterSettings.enabled, processImageFilter]);

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
        displayOptions,
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
    displayOptions,
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
                <ImageFilterControls
                  settings={imageFilterSettings}
                  onSettingsChange={handleImageFilterSettingsChange}
                  processing={imageFilterResult.processing}
                  error={imageFilterResult.error}
                  onApplyImageFilter={handleApplyImageFilter}
                />
                <FrequencyControls
                  settings={frequencySettings}
                  onSettingsChange={handleFrequencySettingsChange}
                  onApply={handleFrequencyApply}
                  isProcessing={isFrequencyProcessing}
                  hasImageData={!!uploadedImage}
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
                  displayOptions={displayOptions}
                  contourSettings={contourSettings}
                  cannyOpacity={cannyOpacity}
                  filteredImageData={imageFilterResult.filteredImageData}
                  imageFilterOpacity={imageFilterSettings.opacity * 100}
                  frequencyData={frequencyData}
                  frequencySettings={frequencySettings}
                  transform={getTransform()}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onWheel={handleWheel}
                  onContainerResize={handleContainerResize}
                />
              </div>
            </div>

            {/* Right Sidebar - Display Settings */}
            <DisplaySettings
              displayOptions={displayOptions}
              onDisplayOptionsChange={handleDisplayOptionsChange}
              onExport={handleExport}
              isExporting={isExporting}
              hasContour={!!brightnessData}
              hasEdge={!!(processedEdgeData || edgeData)}
            />
          </div>
        </main>
      )}
    </div>
  );
}

export default App;