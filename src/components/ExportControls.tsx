import React, { useState, useEffect, useRef } from 'react';
import { ExportSettings } from '../hooks/useImageExport';
import { SettingsStorage } from '../hooks/useLocalStorage';

interface StoredExportSettings {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  customFilename: string;
}

const DEFAULT_EXPORT_SETTINGS: StoredExportSettings = {
  format: 'png',
  quality: 90,
  customFilename: '',
};

interface ExportControlsProps {
  onExport: (settings: ExportSettings) => Promise<void>;
  isExporting?: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onPreviewUrlChange?: (url: string | null) => void;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  onExport,
  isExporting = false,
  canvasRef,
  onPreviewUrlChange,
}) => {
  const initial = SettingsStorage.getExportSettings(DEFAULT_EXPORT_SETTINGS);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>(initial.format);
  const [quality, setQuality] = useState(initial.quality);
  const [customFilename, setCustomFilename] = useState(initial.customFilename);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (format === 'png' || !canvasRef?.current) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      onPreviewUrlChange?.(null);
      setPreviewSize(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
      canvas.toBlob((blob) => {
        if (!blob) return;

        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        onPreviewUrlChange?.(url);
        setPreviewSize(blob.size);
      }, mimeType, quality / 100);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [format, quality, canvasRef, onPreviewUrlChange]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleExport = async () => {
    const settings: ExportSettings = {
      format: format as 'png' | 'jpeg' | 'webp',
      quality,
      includeOriginalSize: true,
      filename: customFilename.trim() || undefined,
    };

    try {
      await onExport(settings);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-md font-semibold text-gray-900 mb-4">Export Image</h3>

      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="png"
                checked={format === 'png'}
                onChange={(e) => { const v = e.target.value as 'png'; setFormat(v); SettingsStorage.saveExportSettings({ format: v, quality, customFilename }); }}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">PNG</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="jpeg"
                checked={format === 'jpeg'}
                onChange={(e) => { const v = e.target.value as 'jpeg'; setFormat(v); SettingsStorage.saveExportSettings({ format: v, quality, customFilename }); }}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">JPEG</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="webp"
                checked={format === 'webp'}
                onChange={(e) => { const v = e.target.value as 'webp'; setFormat(v); SettingsStorage.saveExportSettings({ format: v, quality, customFilename }); }}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">WebP</span>
            </label>
          </div>
        </div>

        {/* JPEG/WebP Quality */}
        {(format === 'jpeg' || format === 'webp') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                {format === 'webp' ? 'WebP' : 'JPEG'} Quality: {quality}%
              </label>
              {previewSize !== null && (
                <span className="text-xs text-gray-500">
                  {previewSize < 1024 * 1024
                    ? `${(previewSize / 1024).toFixed(1)} KB`
                    : `${(previewSize / (1024 * 1024)).toFixed(2)} MB`}
                </span>
              )}
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={quality}
              onChange={(e) => { const v = parseInt(e.target.value); setQuality(v); SettingsStorage.saveExportSettings({ format, quality: v, customFilename }); }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Custom Filename */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filename (optional)
          </label>
          <input
            type="text"
            value={customFilename}
            onChange={(e) => { const v = e.target.value; setCustomFilename(v); SettingsStorage.saveExportSettings({ format, quality, customFilename: v }); }}
            placeholder="Leave empty for auto-generated name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
          <div className="text-xs text-gray-500 mt-1">
            {customFilename.trim()
              ? `${customFilename.trim()}.${format}`
              : `Auto: brightness-contour-[mode]-[timestamp].${format}`
            }
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isExporting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </div>
          ) : (
            `Export as ${format.toUpperCase()}`
          )}
        </button>
      </div>
    </div>
  );
};
