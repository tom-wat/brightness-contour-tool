import { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageCanvas } from './components/ImageCanvas';
import { ImageViewControls } from './components/ImageViewControls';
import { DisplaySettings } from './components/DisplaySettings';
import { ContourControls } from './components/ContourControls';
import { CannyControls } from './components/CannyControls';
import { useBrightnessAnalysis } from './hooks/useBrightnessAnalysis';
import { useCannyDetection } from './hooks/useCannyDetection';
import { ImageUploadResult, ContourSettings, DEFAULT_CONTOUR_LEVELS } from './types/ImageTypes';
import { CannyParams, DEFAULT_CANNY_PARAMS } from './types/CannyTypes';
import { DisplayMode, DEFAULT_APP_SETTINGS } from './types/UITypes';

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

  const { brightnessData, analyzeBrightness } = useBrightnessAnalysis();
  const { edgeData, detectEdges, calculateOptimalThresholds, openCVLoaded } = useCannyDetection();

  const handleImageUpload = useCallback((result: ImageUploadResult) => {
    setUploadedImage(result);
    analyzeBrightness(result.originalImageData, contourSettings);
    detectEdges(result.originalImageData, cannyParams);
  }, [analyzeBrightness, contourSettings, detectEdges, cannyParams]);

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
    }
  }, [uploadedImage, detectEdges]);

  const handleCannyOpacityChange = useCallback((opacity: number) => {
    setCannyOpacity(opacity);
  }, []);

  const handleAutoDetectThresholds = useCallback(() => {
    if (uploadedImage) {
      const optimalThresholds = calculateOptimalThresholds(uploadedImage.originalImageData);
      const newParams = { ...cannyParams, ...optimalThresholds };
      setCannyParams(newParams);
      detectEdges(uploadedImage.originalImageData, newParams);
    }
  }, [uploadedImage, cannyParams, calculateOptimalThresholds, detectEdges]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <h1 className="text-xl font-bold text-gray-900">
            Brightness Contour
          </h1>
        </div>
      </header>

      {!uploadedImage ? (
        <main className="w-full">
          <ImageUploader onImageUpload={handleImageUpload} />
        </main>
      ) : (
        <main>
          <div className="flex">
            {/* Left Sidebar - Controls */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
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
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50 flex flex-col">
              {/* Image View Controls */}
              <div className="sticky top-0 z-10">
                <ImageViewControls />
              </div>
              
              {/* Canvas Area */}
              <div className="flex-1">
                <ImageCanvas
                  originalImageData={uploadedImage.originalImageData}
                  brightnessData={brightnessData}
                  edgeData={edgeData}
                  displayMode={displayMode}
                  contourSettings={contourSettings}
                  cannyOpacity={cannyOpacity}
                />
              </div>
            </div>

            {/* Right Sidebar - Display Settings */}
            <DisplaySettings
              displayMode={displayMode}
              onDisplayModeChange={handleDisplayModeChange}
              onSelectAnotherImage={() => setUploadedImage(null)}
            />
          </div>
        </main>
      )}
    </div>
  );
}

export default App;