import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { AppShell } from '@/components/layout/AppShell';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageCanvas } from '@/components/ImageCanvas';
import { ContourPanel } from '@/components/features/ContourPanel';
import { ImageFilterPanel } from '@/components/features/ImageFilterPanel';
import { FrequencyPanel } from '@/components/features/FrequencyPanel';
import { NoiseReductionPanel } from '@/components/features/NoiseReductionPanel';
import { DisplayPanel } from '@/components/features/DisplayPanel';
import { ExportPanel } from '@/components/features/ExportPanel';
import { useBrightnessAnalysis } from '@/hooks/useBrightnessAnalysis';
import { useImageFilter } from '@/hooks/useImageFilter';
import { useZoomPan } from '@/hooks/useZoomPan';
import { useImageExport, ExportSettings } from '@/hooks/useImageExport';
import { useFrequencySeparation } from '@/hooks/useFrequencySeparation';
import { useNoiseReduction } from '@/hooks/useNoiseReduction';
import { SettingsStorage } from '@/hooks/useLocalStorage';
import { ImageUploadResult, ContourSettings, DEFAULT_CONTOUR_LEVELS } from '@/types/ImageTypes';
import { DisplayOptions, DEFAULT_DISPLAY_OPTIONS } from '@/types/UITypes';
import { ImageFilterSettings } from '@/types/ImageFilterTypes';
import { FrequencySettings, DEFAULT_FREQUENCY_SETTINGS } from '@/types/FrequencyTypes';

/** 等高線設定はドラッグ中に連続で変わるので、再解析はまとめて走らせる */
const ANALYZE_DEBOUNCE_MS = 150;

function App() {
  const [uploadedImage, setUploadedImage] = useState<ImageUploadResult | null>(null);
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>(() => {
    // 保存済み設定にレイヤーが追加された場合に備えてデフォルトとマージする
    const stored = SettingsStorage.getDisplayOptions(DEFAULT_DISPLAY_OPTIONS);
    return {
      ...DEFAULT_DISPLAY_OPTIONS,
      ...stored,
      layers: { ...DEFAULT_DISPLAY_OPTIONS.layers, ...stored.layers },
    };
  });
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
  const [downloadPreview, setDownloadPreview] = useState(false);
  const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null);
  const [frequencySettings, setFrequencySettings] = useState<FrequencySettings>(() => {
    // 保存済み設定に新フィールド（bilateralSigmaColor / guidedStrength 等）が欠けても
    // デフォルトとマージして互換性を保つ
    const stored = SettingsStorage.getFrequencySettings(DEFAULT_FREQUENCY_SETTINGS);
    return { ...DEFAULT_FREQUENCY_SETTINGS, ...stored };
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { brightnessData, analyzeBrightness, clearAnalysis } = useBrightnessAnalysis();
  const {
    settings: imageFilterSettings,
    result: imageFilterResult,
    openCVLoaded: imageFilterOpenCVLoaded,
    openCVLoading: imageFilterOpenCVLoading,
    openCVError: imageFilterOpenCVError,
    processImage: processImageFilter,
    updateSettings: updateImageFilterSettings,
    clearResult: clearImageFilterResult,
  } = useImageFilter();
  const {
    frequencyData,
    isProcessing: isFrequencyProcessing,
    processFrequencySeparation,
    clearFrequencyData,
  } = useFrequencySeparation();
  const {
    settings: noiseReductionSettings,
    result: noiseReductionResult,
    openCVLoaded: noiseReductionOpenCVLoaded,
    openCVLoading: noiseReductionOpenCVLoading,
    openCVError: noiseReductionOpenCVError,
    processImage: processNoiseReduction,
    updateSettings: updateNoiseReductionSettings,
    clearResult: clearNoiseReductionResult,
  } = useNoiseReduction();
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
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getTransform,
  } = useZoomPan(
    containerSize?.width,
    containerSize?.height,
    uploadedImage?.width,
    uploadedImage?.height
  );

  // 処理系のエラーは画面のどこにいても気づけるようトーストで出す
  useEffect(() => {
    if (imageFilterResult.error) toast.error(imageFilterResult.error);
  }, [imageFilterResult.error]);

  useEffect(() => {
    if (noiseReductionResult.error) toast.error(noiseReductionResult.error);
  }, [noiseReductionResult.error]);

  const handleImageUpload = useCallback((result: ImageUploadResult) => {
    setUploadedImage(result);

    // すべての処理結果をリセット
    clearAnalysis();
    clearImageFilterResult();
    clearFrequencyData();
    clearNoiseReductionResult();

    analyzeBrightness(result.originalImageData, contourSettings);

    resetZoom();
    setShouldAutoFit(true);
  }, [analyzeBrightness, contourSettings, resetZoom, clearAnalysis, clearImageFilterResult, clearFrequencyData, clearNoiseReductionResult]);

  const handleReset = useCallback(() => {
    setUploadedImage(null);
    clearAnalysis();
    clearImageFilterResult();
    clearFrequencyData();
    clearNoiseReductionResult();
    setExportPreviewUrl(null);
    resetZoom();
  }, [clearAnalysis, clearImageFilterResult, clearFrequencyData, clearNoiseReductionResult, resetZoom]);

  const handleContainerResize = useCallback((width: number, height: number) => {
    setContainerSize({ width, height });

    // 自動フィットが有効で画像が読み込まれている場合のみ実行
    if (shouldAutoFit && uploadedImage) {
      // 少し遅延を入れてDOMが安定してからフィット実行
      setTimeout(() => {
        fitToScreen(width, height);
        setShouldAutoFit(false);
      }, 50);
    }
  }, [shouldAutoFit, uploadedImage, fitToScreen]);

  const handleDisplayOptionsChange = useCallback((options: DisplayOptions) => {
    setDisplayOptions(options);
    SettingsStorage.saveDisplayOptions(options);
  }, []);

  const handleContourSettingsChange = useCallback((settings: ContourSettings) => {
    setContourSettings(settings);
    SettingsStorage.saveContourSettings(settings);
    if (uploadedImage) {
      if (analyzeDebounceRef.current) clearTimeout(analyzeDebounceRef.current);
      analyzeDebounceRef.current = setTimeout(() => {
        analyzeBrightness(uploadedImage.originalImageData, settings);
      }, ANALYZE_DEBOUNCE_MS);
    }
  }, [uploadedImage, analyzeBrightness]);

  const handleFrequencySettingsChange = useCallback((settings: FrequencySettings) => {
    setFrequencySettings(settings);
    SettingsStorage.saveFrequencySettings(settings);
  }, []);

  const handleFrequencyApply = useCallback(() => {
    if (uploadedImage) {
      processFrequencySeparation(uploadedImage.originalImageData, frequencySettings);
    }
  }, [uploadedImage, processFrequencySeparation, frequencySettings]);

  const handleImageFilterSettingsChange = useCallback((settings: Partial<ImageFilterSettings>) => {
    updateImageFilterSettings(settings);
    // 無効化されたら描画に使う結果も捨てる
    if (settings.enabled === false) clearImageFilterResult();
  }, [updateImageFilterSettings, clearImageFilterResult]);

  const handleApplyImageFilter = useCallback(() => {
    if (!uploadedImage) return;
    // Apply時は自動的にenabledにする
    if (!imageFilterSettings.enabled) updateImageFilterSettings({ enabled: true });
    processImageFilter(uploadedImage.originalImageData);
  }, [uploadedImage, imageFilterSettings.enabled, updateImageFilterSettings, processImageFilter]);

  const handleApplyNoiseReduction = useCallback(() => {
    if (uploadedImage) processNoiseReduction(uploadedImage.originalImageData);
  }, [uploadedImage, processNoiseReduction]);

  const handleDownloadPreviewChange = useCallback((on: boolean) => {
    setDownloadPreview(on);
    if (!on) setExportPreviewUrl(null);
  }, []);

  const handleExportPreviewUrl = useCallback((url: string | null) => {
    setExportPreviewUrl(downloadPreview ? url : null);
  }, [downloadPreview]);

  const handleExport = useCallback(async (settings: ExportSettings) => {
    if (!uploadedImage || !canvasRef.current) return;

    setIsExporting(true);
    try {
      await exportCurrentView({ current: canvasRef.current }, settings, {
        timestamp: new Date().toISOString(),
        displayOptions,
        contourSettings,
        imageSize: { width: uploadedImage.width, height: uploadedImage.height },
      });
      toast.success(`Exported as ${settings.format.toUpperCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  }, [uploadedImage, displayOptions, contourSettings, exportCurrentView]);

  const hasImage = !!uploadedImage;

  const leftPanel = (
    <>
      <ContourPanel
        settings={contourSettings}
        onSettingsChange={handleContourSettingsChange}
        disabled={!hasImage}
      />
      <ImageFilterPanel
        settings={imageFilterSettings}
        onSettingsChange={handleImageFilterSettingsChange}
        onApply={handleApplyImageFilter}
        processing={imageFilterResult.processing}
        hasImage={hasImage}
        openCVLoaded={imageFilterOpenCVLoaded}
        openCVLoading={imageFilterOpenCVLoading}
        openCVError={imageFilterOpenCVError}
      />
      <FrequencyPanel
        settings={frequencySettings}
        onSettingsChange={handleFrequencySettingsChange}
        onApply={handleFrequencyApply}
        processing={isFrequencyProcessing}
        hasImage={hasImage}
      />
      <NoiseReductionPanel
        settings={noiseReductionSettings}
        onSettingsChange={updateNoiseReductionSettings}
        onApply={handleApplyNoiseReduction}
        processing={noiseReductionResult.processing}
        hasImage={hasImage}
        openCVLoaded={noiseReductionOpenCVLoaded}
        openCVLoading={noiseReductionOpenCVLoading}
        openCVError={noiseReductionOpenCVError}
      />
    </>
  );

  const rightPanel = (
    <>
      <DisplayPanel
        options={displayOptions}
        onOptionsChange={handleDisplayOptionsChange}
        hasContour={!!brightnessData}
        downloadPreview={downloadPreview}
        onDownloadPreviewChange={handleDownloadPreviewChange}
      />
      <ExportPanel
        onExport={handleExport}
        isExporting={isExporting}
        disabled={!hasImage}
        canvasRef={canvasRef}
        onPreviewUrlChange={handleExportPreviewUrl}
      />
    </>
  );

  return (
    <>
      <AppShell
        title="Brightness Contour"
        onTitleClick={hasImage ? handleReset : undefined}
        headerActions={
          uploadedImage && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {uploadedImage.width} × {uploadedImage.height}
            </span>
          )
        }
        leftPanel={leftPanel}
        leftPanelLabel="Controls"
        rightPanel={rightPanel}
        rightPanelLabel="Display"
      >
        {uploadedImage ? (
          <ImageCanvas
            ref={canvasRef}
            originalImageData={uploadedImage.originalImageData}
            brightnessData={brightnessData}
            displayOptions={displayOptions}
            contourSettings={contourSettings}
            filteredImageData={imageFilterResult.filteredImageData}
            imageFilterOpacity={imageFilterSettings.opacity * 100}
            denoisedImageData={noiseReductionResult.denoisedImageData}
            denoiseOpacity={noiseReductionSettings.opacity * 100}
            frequencyData={frequencyData}
            transform={getTransform()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onContainerResize={handleContainerResize}
            zoomLevel={zoomPanState.zoom}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onFitToScreen={fitToScreen}
            onActualSize={actualSize}
            onNativeTouchStart={handleTouchStart}
            onNativeTouchMove={handleTouchMove}
            onNativeTouchEnd={handleTouchEnd}
            exportPreviewUrl={exportPreviewUrl}
          />
        ) : (
          <div className="h-full p-4 lg:p-6">
            <ImageUploader onImageUpload={handleImageUpload} className="h-full" />
          </div>
        )}
      </AppShell>
      <Toaster />
    </>
  );
}

export default App;
