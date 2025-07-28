import { useState, useCallback } from 'react';
import { ImageUploadResult, MAX_IMAGE_SIZE, MAX_FILE_SIZE } from '../types/ImageTypes';

interface UseImageUploadReturn {
  uploadedImage: ImageUploadResult | null;
  isLoading: boolean;
  error: string | null;
  handleFileUpload: (file: File) => Promise<void>;
  clearImage: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploadedImage, setUploadedImage] = useState<ImageUploadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      return 'Unsupported file format. Only JPEG, PNG, GIF, WebP are supported.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum ${MAX_FILE_SIZE / (1024 * 1024)}MB allowed.`;
    }

    return null;
  };

  const createImageData = (image: HTMLImageElement): ImageData => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context.');
    }

    let { width, height } = image;
    
    if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
      const scale = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
    }

    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(image, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  };

  const handleFileUpload = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      const image = new Image();
      
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Failed to load image.'));
        image.src = URL.createObjectURL(file);
      });

      const originalImageData = createImageData(image);

      setUploadedImage({
        file,
        image,
        originalImageData,
        width: originalImageData.width,
        height: originalImageData.height,
      });

      URL.revokeObjectURL(image.src);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    setUploadedImage(null);
    setError(null);
  }, []);

  return {
    uploadedImage,
    isLoading,
    error,
    handleFileUpload,
    clearImage,
  };
};