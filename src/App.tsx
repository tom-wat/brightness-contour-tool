import { useState, useCallback, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageCanvas } from './components/ImageCanvas';
import { ImageViewControls } from './components/ImageViewControls';
import { DisplaySettings } from './components/DisplaySettings';
import { ContourControls } from './components/ContourControls';
import { ImageFilterControls } from './components/ImageFilterControls';
import { FrequencyControls } from './components/FrequencyControls';
import { useBrightnessAnalysis } from './hooks/useBrightnessAnalysis';
import { useImageFilter } from './hooks/useImageFilter';
import { useZoomPan } from './hooks/useZoomPan';
import { useImageExport } from './hooks/useImageExport';
import { useFrequencySeparation } from './hooks/useFrequencySeparation';
import { SettingsStorage } from './hooks/useLocalStorage';
import { ImageUploadResult, ContourSettings, DEFAULT_CONTOUR_LEVELS } from './types/ImageTypes';
import { DisplayOptions, DEFAULT_DISPLAY_OPTIONS } from './types/UITypes';
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
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [shouldAutoFit, setShouldAutoFit] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [frequencySettings, setFrequencySettings] = useState<FrequencySettings>(() => {
    return SettingsStorage.getFrequencySettings(DEFAULT_FREQUENCY_SETTINGS);
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { brightnessData, analyzeBrightness, clearAnalysis } = useBrightnessAnalysis();
  const { settings: imageFilterSettings, result: imageFilterResult, openCVLoaded: imageFilterOpenCVLoaded, openCVLoading: imageFilterOpenCVLoading, openCVError: imageFilterOpenCVError, processImage: processImageFilter, updateSettings: updateImageFilterSettings, clearResult: clearImageFilterResult } = useImageFilter();
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
    clearImageFilterResult(); // 画像フィルタ結果をクリア
    
    // 新しい画像で処理を開始
    analyzeBrightness(result.originalImageData, contourSettings);

    // ズーム・パン状態をリセット
    resetZoom();
    // 自動フィット有効化
    setShouldAutoFit(true);
  }, [analyzeBrightness, contourSettings, resetZoom, clearAnalysis, clearImageFilterResult]);

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


  const handleFrequencySettingsChange = useCallback((settings: FrequencySettings) => {
    setFrequencySettings(settings);
    SettingsStorage.saveFrequencySettings(settings);
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
    if (uploadedImage) {
      console.log('Manually applying image filter');
      // Apply時は自動的にenabledにする
      if (!imageFilterSettings.enabled) {
        updateImageFilterSettings({ enabled: true });
      }
      processImageFilter(uploadedImage.originalImageData);
    }
  }, [uploadedImage, imageFilterSettings.enabled, updateImageFilterSettings, processImageFilter]);


  const handleExport = useCallback(async (settings: ExportSettings) => {
    if (!uploadedImage || !canvasRef.current) return;

    setIsExporting(true);
    
    try {
      const metadata = {
        timestamp: new Date().toISOString(),
        displayOptions,
        contourSettings,
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
    exportCurrentView,
  ]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="px-6 py-3 flex items-center justify-between">
          <h1
            className={`text-lg font-bold text-gray-900 ${uploadedImage ? 'cursor-pointer hover:text-gray-600 transition-colors duration-200' : ''}`}
            onClick={() => uploadedImage && setUploadedImage(null)}
          >
            Brightness Contour
          </h1>
        </div>
      </header>

      {!uploadedImage ? (
        <main className="flex-1 w-full">
          <ImageUploader onImageUpload={handleImageUpload} />
        </main>
      ) : (
        <main className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Controls */}
            <div className="w-80 bg-white border-r border-gray-100 flex flex-col">
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
                  openCVLoaded={imageFilterOpenCVLoaded}
                  openCVLoading={imageFilterOpenCVLoading}
                  openCVError={imageFilterOpenCVError}
                />
                <FrequencyControls
                  settings={frequencySettings}
                  onSettingsChange={handleFrequencySettingsChange}
                  onApply={handleFrequencyApply}
                  isProcessing={isFrequencyProcessing}
                  hasImageData={!!uploadedImage}
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
                  displayOptions={displayOptions}
                  contourSettings={contourSettings}
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
            />
          </div>
        </main>
      )}
    </div>
  );
}

export default App;