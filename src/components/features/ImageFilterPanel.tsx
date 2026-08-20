import { CollapsibleSection } from '@/components/layout/CollapsibleSection';
import { LabeledSlider } from '@/components/controls/LabeledSlider';
import { ApplyButton } from '@/components/controls/ApplyButton';
import { StatusNote } from '@/components/controls/StatusNote';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageFilterSettings, ImageFilterMethod } from '@/types/ImageFilterTypes';
import { FILTER_METHOD_LABELS } from '@/lib/filter-labels';

interface ImageFilterPanelProps {
  settings: ImageFilterSettings;
  onSettingsChange: (settings: Partial<ImageFilterSettings>) => void;
  onApply: () => void;
  processing: boolean;
  hasImage: boolean;
  openCVLoaded: boolean;
  openCVLoading: boolean;
  openCVError: string | null;
}

export function ImageFilterPanel({
  settings,
  onSettingsChange,
  onApply,
  processing,
  hasImage,
  openCVLoaded,
  openCVLoading,
  openCVError,
}: ImageFilterPanelProps) {
  const disabled = processing || !hasImage;

  return (
    <CollapsibleSection title="Image Filter">
      {openCVLoading && <StatusNote>Loading OpenCV.js…</StatusNote>}
      {!openCVLoading && openCVError && (
        <StatusNote error>OpenCV.js failed to load. Reload the page to retry.</StatusNote>
      )}

      <ApplyButton
        label="Apply filter"
        onClick={onApply}
        processing={processing}
        disabled={!hasImage || !openCVLoaded}
      />

      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm">Method</Label>
        <Select
          value={settings.method}
          onValueChange={(method) =>
            // Picking a method implies wanting it applied.
            onSettingsChange({ method: method as ImageFilterMethod, enabled: true })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FILTER_METHOD_LABELS) as ImageFilterMethod[]).map((method) => (
              <SelectItem key={method} value={method}>
                {FILTER_METHOD_LABELS[method]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <LabeledSlider
        label="Layer opacity"
        value={Math.round(settings.opacity * 100)}
        onChange={(value) => onSettingsChange({ opacity: value / 100 })}
        min={0}
        max={100}
        step={10}
        unit="%"
        disabled={disabled}
      />

      {settings.method === 'gaussian' && (
        <LabeledSlider
          label="Blur radius"
          value={settings.gaussianParams.radius}
          onChange={(radius) => onSettingsChange({ gaussianParams: { ...settings.gaussianParams, radius } })}
          min={1}
          max={100}
          unit="px"
          disabled={disabled}
        />
      )}

      {settings.method === 'median' && (
        <LabeledSlider
          label="Filter radius"
          value={settings.medianParams.radius}
          onChange={(radius) => onSettingsChange({ medianParams: { ...settings.medianParams, radius } })}
          min={1}
          max={50}
          unit="px"
          disabled={disabled}
        />
      )}

      {settings.method === 'bilateral' && (
        <>
          <LabeledSlider
            label="Filter radius"
            value={settings.bilateralParams.radius}
            onChange={(radius) => onSettingsChange({ bilateralParams: { ...settings.bilateralParams, radius } })}
            min={1}
            max={30}
            unit="px"
            disabled={disabled}
          />
          <LabeledSlider
            label="Color sigma"
            value={settings.bilateralParams.sigmaColor}
            onChange={(sigmaColor) => onSettingsChange({ bilateralParams: { ...settings.bilateralParams, sigmaColor } })}
            min={1}
            max={150}
            disabled={disabled}
          />
          <LabeledSlider
            label="Space sigma"
            value={settings.bilateralParams.sigmaSpace}
            onChange={(sigmaSpace) => onSettingsChange({ bilateralParams: { ...settings.bilateralParams, sigmaSpace } })}
            min={1}
            max={100}
            disabled={disabled}
          />
        </>
      )}

      {settings.method === 'guided' && (
        <>
          <LabeledSlider
            label="Filter radius"
            value={settings.guidedParams.radius}
            onChange={(radius) => onSettingsChange({ guidedParams: { ...settings.guidedParams, radius } })}
            min={1}
            max={50}
            unit="px"
            disabled={disabled}
          />
          <LabeledSlider
            label="Smoothing"
            value={settings.guidedParams.strength}
            onChange={(strength) => onSettingsChange({ guidedParams: { ...settings.guidedParams, strength } })}
            min={1}
            max={100}
            disabled={disabled}
          />
        </>
      )}
    </CollapsibleSection>
  );
}
