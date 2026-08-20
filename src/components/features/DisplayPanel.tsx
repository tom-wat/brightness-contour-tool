import { CollapsibleSection } from '@/components/layout/CollapsibleSection';
import { ToggleChip } from '@/components/controls/ToggleChip';
import { Label } from '@/components/ui/label';
import { DisplayLayers, DisplayOptions } from '@/types/UITypes';

interface LayerGroup {
  title: string;
  chips: { key: keyof DisplayLayers; label: string }[];
}

const LAYER_GROUPS: LayerGroup[] = [
  {
    title: 'Image',
    chips: [
      { key: 'original', label: 'Original' },
      { key: 'filtered', label: 'Filtered' },
      { key: 'denoised', label: 'Denoised' },
    ],
  },
  {
    title: 'Contours',
    chips: [
      { key: 'contour', label: 'Original' },
      { key: 'filteredContour', label: 'Filtered' },
      { key: 'denoisedContour', label: 'Denoised' },
    ],
  },
  {
    title: 'Frequency',
    chips: [
      { key: 'lowFrequency', label: 'Low' },
      { key: 'highFrequencyCombined', label: 'High' },
      { key: 'highFrequencyBright', label: 'Bright' },
      { key: 'highFrequencyDark', label: 'Dark' },
    ],
  },
];

interface DisplayPanelProps {
  options: DisplayOptions;
  onOptionsChange: (options: DisplayOptions) => void;
  /** Contours can only be shown once the brightness analysis has run. */
  hasContour: boolean;
  downloadPreview: boolean;
  onDownloadPreviewChange: (on: boolean) => void;
}

/** Layer visibility and view-wide switches. */
export function DisplayPanel({
  options,
  onOptionsChange,
  hasContour,
  downloadPreview,
  onDownloadPreviewChange,
}: DisplayPanelProps) {
  const toggleLayer = (key: keyof DisplayLayers) => {
    onOptionsChange({
      ...options,
      layers: { ...options.layers, [key]: !options.layers[key] },
    });
  };

  const isContourGroup = (title: string) => title === 'Contours';

  return (
    <>
      <CollapsibleSection title="Layers">
        {LAYER_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <Label className="text-sm">{group.title}</Label>
            <div className="flex flex-wrap gap-1.5">
              {group.chips.map(({ key, label }) => (
                <ToggleChip
                  key={key}
                  label={label}
                  pressed={options.layers[key]}
                  onPressedChange={() => toggleLayer(key)}
                  disabled={isContourGroup(group.title) && !hasContour}
                />
              ))}
            </div>
          </div>
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="View">
        <div className="flex flex-wrap gap-1.5">
          <ToggleChip
            label="Grayscale"
            pressed={options.grayscaleMode}
            onPressedChange={(grayscaleMode) => onOptionsChange({ ...options, grayscaleMode })}
          />
          <ToggleChip
            label="Download preview"
            pressed={downloadPreview}
            onPressedChange={onDownloadPreviewChange}
          />
        </div>
      </CollapsibleSection>
    </>
  );
}
