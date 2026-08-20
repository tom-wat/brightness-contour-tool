import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleNotch, Image as ImageIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageUploadResult } from '@/types/ImageTypes';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUpload: (result: ImageUploadResult) => void;
  className?: string;
}

export function ImageUploader({ onImageUpload, className }: ImageUploaderProps) {
  const { uploadedImage, isLoading, error, handleFileUpload } = useImageUpload();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (file && file.type.startsWith('image/')) void handleFileUpload(file);
    },
    [handleFileUpload]
  );

  useEffect(() => {
    if (uploadedImage) onImageUpload(uploadedImage);
  }, [uploadedImage, onImageUpload]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Paste an image straight from the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith('image/')
      );
      if (item) {
        e.preventDefault();
        handleFile(item.getAsFile());
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFile]);

  return (
    <div className={className}>
      <div
        role="button"
        aria-label="Upload image"
        className={cn(
          'flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragOver
            ? 'border-primary bg-accent'
            : 'border-border bg-background hover:border-muted-foreground'
        )}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => inputRef.current?.click()}
      >
        {isLoading ? (
          <>
            <CircleNotch size={40} className="animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Processing image…</p>
          </>
        ) : (
          <>
            <ImageIcon size={56} className="text-muted-foreground" weight="thin" />
            <p className="mt-4 text-base font-medium">
              <span className="hidden lg:inline">Drop image here, click to select, or paste</span>
              <span className="lg:hidden">Tap to select image</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              JPEG, PNG, GIF, WebP · up to 10 MB, 8000 × 8000 px
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
