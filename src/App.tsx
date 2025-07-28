import { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageCanvas } from './components/ImageCanvas';
import { ControlPanel } from './components/ControlPanel';
import { useBrightnessAnalysis } from './hooks/useBrightnessAnalysis';
import { useCannyDetection } from './hooks/useCannyDetection';
import { ImageUploadResult, ContourSettings, DEFAULT_CONTOUR_LEVELS } from './types/ImageTypes';
import { DisplayMode, DEFAULT_APP_SETTINGS } from './types/UITypes';

function App() {
  const [uploadedImage, setUploadedImage] = useState<ImageUploadResult | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DEFAULT_APP_SETTINGS.displayMode);
  const [contourSettings, setContourSettings] = useState<ContourSettings>({
    levels: DEFAULT_CONTOUR_LEVELS,
    lineThickness: 1,
    transparency: 80,
    gaussianBlur: 0,
  });

  const { brightnessData, analyzeBrightness } = useBrightnessAnalysis();
  const { } = useCannyDetection();

  const handleImageUpload = useCallback((result: ImageUploadResult) => {
    setUploadedImage(result);
    analyzeBrightness(result.originalImageData, contourSettings);
  }, [analyzeBrightness, contourSettings]);

  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
  }, []);

  const handleContourSettingsChange = useCallback((settings: ContourSettings) => {
    setContourSettings(settings);
    if (uploadedImage) {
      analyzeBrightness(uploadedImage.originalImageData, settings);
    }
  }, [uploadedImage, analyzeBrightness]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900">
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
          <div className="flex h-full">
            {/* Left Sidebar */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <ControlPanel
                  displayMode={displayMode}
                  contourSettings={contourSettings}
                  onDisplayModeChange={handleDisplayModeChange}
                  onContourSettingsChange={handleContourSettingsChange}
                />
                <div className="px-6 pb-6 pt-4">
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="w-full px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors duration-200"
                  >
                    Select Another Image
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 bg-slate-50">
              <ImageCanvas
                originalImageData={uploadedImage.originalImageData}
                brightnessData={brightnessData}
                displayMode={displayMode}
                contourSettings={contourSettings}
              />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;