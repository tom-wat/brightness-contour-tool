import { CollapsibleSection } from '@/components/layout/CollapsibleSection';
import { LabeledSlider } from '@/components/controls/LabeledSlider';
import { ContourSettings } from '@/types/ImageTypes';

interface ContourPanelProps {
  settings: ContourSettings;
  onSettingsChange: (settings: ContourSettings) => void;
  disabled?: boolean;
}

/** Contour detection settings. Changes re-analyze the image (debounced by App). */
export function ContourPanel({ settings, onSettingsChange, disabled }: ContourPanelProps) {
  const set = (patch: Partial<ContourSettings>) =>
    onSettingsChange({ ...settings, ...patch });

  return (
    <CollapsibleSection title="Contour">
      <LabeledSlider
        label="Brightness levels"
        value={settings.levels}
        onChange={(levels) => set({ levels })}
        min={1}
        max={64}
        disabled={disabled}
      />
      <LabeledSlider
        label="Opacity"
        value={settings.transparency}
        onChange={(transparency) => set({ transparency })}
        min={0}
        max={100}
        step={5}
        unit="%"
        disabled={disabled}
      />
      <LabeledSlider
        label="Contrast"
        value={settings.contourContrast ?? 0}
        onChange={(contourContrast) => set({ contourContrast })}
        min={0}
        max={100}
        step={5}
        unit="%"
        disabled={disabled}
      />
      <LabeledSlider
        label="Min line distance"
        value={settings.minContourDistance ?? 0}
        onChange={(minContourDistance) => set({ minContourDistance })}
        min={0}
        max={3}
        unit="px"
        disabled={disabled}
      />
    </CollapsibleSection>
  );
}
