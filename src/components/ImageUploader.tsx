import React, { useCallback, useRef } from 'react';
import { useImageUpload } from '../hooks/useImageUpload';

interface ImageUploaderProps {
  onImageUpload: (result: import('../types/ImageTypes').ImageUploadResult) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const { uploadedImage, isLoading, error, handleFileUpload } = useImageUpload();
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      handleFileUpload(imageFile);
    }
  }, [handleFileUpload]);

  const handleAreaClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  React.useEffect(() => {
    if (uploadedImage) {
      onImageUpload(uploadedImage);
    }
  }, [uploadedImage, onImageUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  return (
    <div className="w-full h-full flex flex-col p-3 lg:p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <div
        className={`border-2 border-dashed text-center transition-all duration-200 flex-1 flex flex-col justify-center bg-white cursor-pointer rounded-lg ${isDraggingOver ? 'border-blue-400' : 'border-gray-300 hover:border-gray-400'}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        onClick={handleAreaClick}
      >
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="text-gray-600">Processing image...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl text-gray-300">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                <span className="hidden lg:inline">Drop image here or click to select</span>
                <span className="lg:hidden">Tap to select image</span>
              </p>
              <p className="text-sm text-gray-500">
                <span className="hidden lg:inline">Supports: JPEG, PNG, GIF, WebP (Max: 10MB, 8000×8000px)</span>
                <span className="lg:hidden">
                  Supports: JPEG, PNG, GIF, WebP<br />
                  (Max: 10MB, 8000×8000px)
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

    </div>
  );
};