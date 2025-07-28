import React, { useCallback } from 'react';
import { useImageUpload } from '../hooks/useImageUpload';

interface ImageUploaderProps {
  onImageUpload: (result: import('../types/ImageTypes').ImageUploadResult) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const { uploadedImage, isLoading, error, handleFileUpload } = useImageUpload();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      handleFileUpload(imageFile);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  React.useEffect(() => {
    if (uploadedImage) {
      onImageUpload(uploadedImage);
    }
  }, [uploadedImage, onImageUpload]);

  return (
    <div className="w-full p-6">
      <div
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-all duration-200 min-h-[80vh] flex flex-col justify-center bg-white"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            <p className="text-slate-600">Processing image...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl text-slate-400">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-slate-900">
                Drop image here or click to select
              </p>
              <p className="text-sm text-slate-500">
                Supports: JPEG, PNG, GIF, WebP (Max: 10MB, 4000×4000px)
              </p>
            </div>
            <label className="inline-block">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors duration-200 cursor-pointer">
                Choose File
              </span>
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {uploadedImage && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-3">
            <div className="text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-green-800 font-medium">{uploadedImage.file.name}</p>
              <p className="text-green-600 text-sm">
                {uploadedImage.width} × {uploadedImage.height}px
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};