import { CollapsibleSection } from '@/components/layout/CollapsibleSection';
import { LabeledSlider } from '@/components/controls/LabeledSlider';
import { ApplyButton } from '@/components/controls/ApplyButton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FILTER_METHOD_LABELS } from '@/lib/filter-labels';
import { FrequencySettings, FrequencyFilterMethod } from '@/types/FrequencyTypes';

interface FrequencyPanelProps {
  settings: FrequencySettings;
  onSettingsChange: (settings: FrequencySettings) => void;
  onApply: () => void;
  processing: boolean;
  hasImage: boolean;
}

export function FrequencyPanel({
  settings,
  onSettingsChange,
  onApply,
  processing,
  hasImage,
}: FrequencyPanelProps) {
  const disabled = processing || !hasImage;
  const set = (patch: Partial<FrequencySettings>) => onSettingsChange({ ...settings, ...patch });

  return (
    <CollapsibleSection title="Frequency Separation" defaultOpen={false}>
      <ApplyButton
        label="Apply separation"
        onClick={onApply}
        processing={processing}
        disabled={!hasImage}
      />

      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm">Low-pass</Label>
        <Select
          value={settings.filterMethod}
          onValueChange={(filterMethod) => set({ filterMethod: filterMethod as FrequencyFilterMethod })}
          disabled={disabled}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FILTER_METHOD_LABELS) as FrequencyFilterMethod[]).map((method) => (
              <SelectItem key={method} value={method}>
                {FILTER_METHOD_LABELS[method]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <LabeledSlider
        label="Blur radius"
        value={settings.blurRadius}
        onChange={(blurRadius) => set({ blurRadius })}
        min={1}
        max={50}
        unit="px"
        disabled={disabled}
      />

      {settings.filterMethod === 'bilateral' && (
        <LabeledSlider
          label="Color sigma"
          value={settings.bilateralSigmaColor}
          onChange={(bilateralSigmaColor) => set({ bilateralSigmaColor })}
          min={1}
          max={150}
          disabled={disabled}
        />
      )}

      {settings.filterMethod === 'guided' && (
        <LabeledSlider
          label="Smoothing"
          value={settings.guidedStrength}
          onChange={(guidedStrength) => set({ guidedStrength })}
          min={1}
          max={100}
          disabled={disabled}
        />
      )}

      <LabeledSlider
        label="Bright intensity"
        value={settings.brightIntensity}
        onChange={(brightIntensity) => set({ brightIntensity })}
        min={1}
        max={3}
        unit="×"
        disabled={disabled}
      />
      <LabeledSlider
        label="Dark intensity"
        value={settings.darkIntensity}
        onChange={(darkIntensity) => set({ darkIntensity })}
        min={1}
        max={3}
        unit="×"
        disabled={disabled}
      />
    </CollapsibleSection>
  );
}
