import React, { useEffect, useRef, useState } from 'react';
import { DownloadSimple, CircleNotch } from '@phosphor-icons/react';
import { CollapsibleSection } from '@/components/layout/CollapsibleSection';
import { LabeledSlider } from '@/components/controls/LabeledSlider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsStorage } from '@/hooks/useLocalStorage';
import { ExportSettings } from '@/hooks/useImageExport';

type ExportFormat = 'png' | 'jpeg' | 'webp';

const FORMATS: ExportFormat[] = ['png', 'jpeg', 'webp'];

interface StoredExportSettings {
  format: ExportFormat;
  quality: number;
  customFilename: string;
}

const DEFAULT_EXPORT_SETTINGS: StoredExportSettings = {
  format: 'png',
  quality: 90,
  customFilename: '',
};

/** Preview re-encoding is expensive; wait for the settings to settle. */
const PREVIEW_DEBOUNCE_MS = 250;

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface ExportPanelProps {
  onExport: (settings: ExportSettings) => Promise<void>;
  isExporting: boolean;
  disabled: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  /** Receives an object URL of the re-encoded canvas, or null when there is none. */
  onPreviewUrlChange?: (url: string | null) => void;
}

export function ExportPanel({
  onExport,
  isExporting,
  disabled,
  canvasRef,
  onPreviewUrlChange,
}: ExportPanelProps) {
  const initial = SettingsStorage.getExportSettings(DEFAULT_EXPORT_SETTINGS);
  const [format, setFormat] = useState<ExportFormat>(initial.format);
  const [quality, setQuality] = useState(initial.quality);
  const [customFilename, setCustomFilename] = useState(initial.customFilename);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = (patch: Partial<StoredExportSettings>) => {
    SettingsStorage.saveExportSettings({ format, quality, customFilename, ...patch });
  };

  // PNG is lossless, so there is nothing to preview or measure for it.
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

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          onPreviewUrlChange?.(url);
          setPreviewSize(blob.size);
        },
        format === 'webp' ? 'image/webp' : 'image/jpeg',
        quality / 100
      );
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [format, quality, canvasRef, onPreviewUrlChange]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleExport = () => {
    void onExport({
      format,
      quality,
      includeOriginalSize: true,
      filename: customFilename.trim() || undefined,
    });
  };

  return (
    <CollapsibleSection title="Export">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm">Format</Label>
        <Select
          value={format}
          onValueChange={(value) => {
            const next = value as ExportFormat;
            setFormat(next);
            persist({ format: next });
          }}
          disabled={isExporting}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATS.map((value) => (
              <SelectItem key={value} value={value}>
                {value.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {format !== 'png' && (
        <div className="space-y-1">
          <LabeledSlider
            label="Quality"
            value={quality}
            onChange={(value) => {
              setQuality(value);
              persist({ quality: value });
            }}
            min={10}
            max={100}
            step={5}
            unit="%"
            disabled={isExporting}
          />
          <p className="text-xs tabular-nums text-muted-foreground">
            {previewSize === null ? 'Estimating size…' : `About ${formatBytes(previewSize)}`}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="export-filename">
          Filename
        </Label>
        <Input
          id="export-filename"
          value={customFilename}
          onChange={(e) => {
            setCustomFilename(e.target.value);
            persist({ customFilename: e.target.value });
          }}
          placeholder="Leave empty for an automatic name"
          disabled={isExporting}
        />
        <p className="truncate text-xs text-muted-foreground">
          {customFilename.trim()
            ? `${customFilename.trim()}.${format}`
            : `brightness-contour-[layers]-[timestamp].${format}`}
        </p>
      </div>

      <Button className="w-full" onClick={handleExport} disabled={disabled || isExporting}>
        {isExporting ? <CircleNotch className="animate-spin" /> : <DownloadSimple />}
        {isExporting ? 'Exporting…' : `Export as ${format.toUpperCase()}`}
      </Button>
    </CollapsibleSection>
  );
}
