import { CollapsibleSection } from '@/components/layout/CollapsibleSection';
import { LabeledSlider } from '@/components/controls/LabeledSlider';
import { ApplyButton } from '@/components/controls/ApplyButton';
import { StatusNote } from '@/components/controls/StatusNote';
import { NoiseReductionSettings } from '@/types/NoiseReductionTypes';

interface NoiseReductionPanelProps {
  settings: NoiseReductionSettings;
  onSettingsChange: (settings: Partial<NoiseReductionSettings>) => void;
  onApply: () => void;
  processing: boolean;
  hasImage: boolean;
  openCVLoaded: boolean;
  openCVLoading: boolean;
  openCVError: string | null;
}

export function NoiseReductionPanel({
  settings,
  onSettingsChange,
  onApply,
  processing,
  hasImage,
  openCVLoaded,
  openCVLoading,
  openCVError,
}: NoiseReductionPanelProps) {
  const disabled = processing || !hasImage;

  return (
    <CollapsibleSection title="Noise Reduction" defaultOpen={false}>
      {openCVLoading && <StatusNote>Loading OpenCV.js…</StatusNote>}
      {!openCVLoading && openCVError && (
        <StatusNote error>OpenCV.js failed to load. Reload the page to retry.</StatusNote>
      )}

      <ApplyButton
        label="Apply noise reduction"
        onClick={onApply}
        processing={processing}
        disabled={!hasImage || !openCVLoaded}
      />

      <LabeledSlider
        label="Luminance"
        value={settings.luminanceStrength}
        onChange={(luminanceStrength) => onSettingsChange({ luminanceStrength })}
        min={0}
        max={100}
        unit="%"
        disabled={disabled}
      />
      <LabeledSlider
        label="Colour"
        value={settings.colorStrength}
        onChange={(colorStrength) => onSettingsChange({ colorStrength })}
        min={0}
        max={100}
        unit="%"
        disabled={disabled}
      />
      <LabeledSlider
        label="Detail"
        value={settings.detail}
        onChange={(detail) => onSettingsChange({ detail })}
        min={0}
        max={100}
        unit="%"
        disabled={disabled}
      />
      <LabeledSlider
        label="Radius"
        value={settings.radius}
        onChange={(radius) => onSettingsChange({ radius })}
        min={1}
        max={7}
        unit="px"
        disabled={disabled}
      />
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
    </CollapsibleSection>
  );
}
