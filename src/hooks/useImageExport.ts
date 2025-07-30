import { useCallback } from 'react';
import { DisplayMode, DisplayOptions, DEFAULT_DISPLAY_OPTIONS } from '../types/UITypes';
import { ContourSettings } from '../types/ImageTypes';
import { CannyParams } from '../types/CannyTypes';
import { EdgeProcessingSettings } from '../types/EdgeProcessingTypes';

export interface ExportSettings {
  format: 'png' | 'jpeg';
  quality: number; // JPEG quality (1-100)
  includeOriginalSize: boolean;
  filename?: string;
}

export interface ExportMetadata {
  timestamp: string;
  displayMode?: DisplayMode; // 後方互換性のため残しておく
  displayOptions?: DisplayOptions; // 新しい表示設定
  contourSettings: ContourSettings;
  cannyParams?: CannyParams;
  edgeProcessingSettings?: EdgeProcessingSettings;
  cannyOpacity?: number;
  imageSize: {
    width: number;
    height: number;
  };
}

export const useImageExport = () => {
  
  const generateFilename = useCallback((
    displayOptions: DisplayOptions | DisplayMode,
    format: string,
    customName?: string
  ): string => {
    if (customName) {
      return `${customName}.${format}`;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    // 新しいDisplayOptionsの場合
    if (typeof displayOptions === 'object' && 'layers' in displayOptions) {
      const activeLayers = Object.entries(displayOptions.layers)
        .filter(([, active]) => active)
        .map(([layer]) => layer)
        .join('-');
      const grayscaleMode = displayOptions.grayscaleMode ? '-grayscale' : '';
      return `brightness-contour-${activeLayers}${grayscaleMode}-${timestamp}.${format}`;
    }
    
    // 従来のDisplayModeの場合（後方互換性）
    const modeShort = (displayOptions as DisplayMode).replace(/_/g, '-').toLowerCase();
    return `brightness-contour-${modeShort}-${timestamp}.${format}`;
  }, []);

  const exportCanvasAsImage = useCallback((
    canvas: HTMLCanvasElement,
    settings: ExportSettings,
    metadata?: ExportMetadata
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const { format, quality, filename } = settings;
        
        // Canvas から画像データを取得
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const qualityValue = format === 'jpeg' ? quality / 100 : undefined;
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }

          // ダウンロード用のリンクを作成
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename || generateFilename(
            metadata?.displayOptions || metadata?.displayMode || DEFAULT_DISPLAY_OPTIONS,
            format
          );

          // ダウンロード実行
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // メモリクリーンアップ
          URL.revokeObjectURL(url);
          
          resolve();
        }, mimeType, qualityValue);
      } catch (error) {
        reject(error);
      }
    });
  }, [generateFilename]);

  const exportWithMetadata = useCallback((
    canvas: HTMLCanvasElement,
    settings: ExportSettings,
    metadata: ExportMetadata
  ): Promise<void> => {
    // メタデータをJSON形式で別途保存する場合の準備
    const metadataJson = JSON.stringify(metadata, null, 2);
    
    // 画像をエクスポート
    return exportCanvasAsImage(canvas, settings, metadata).then(() => {
      // メタデータファイルも保存したい場合（オプション）
      if (settings.filename && settings.filename.includes('with-metadata')) {
        const metadataBlob = new Blob([metadataJson], { type: 'application/json' });
        const url = URL.createObjectURL(metadataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = settings.filename.replace(/\.(png|jpeg|jpg)$/, '-metadata.json');
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });
  }, [exportCanvasAsImage]);


  const exportCurrentView = useCallback((
    canvasRef: React.RefObject<HTMLCanvasElement>,
    settings: ExportSettings,
    metadata: ExportMetadata
  ): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return Promise.reject(new Error('Canvas not found'));
    }

    return exportWithMetadata(canvas, settings, metadata);
  }, [exportWithMetadata]);

  return {
    exportCurrentView,
    exportCanvasAsImage,
    exportWithMetadata,
    generateFilename,
  };
};