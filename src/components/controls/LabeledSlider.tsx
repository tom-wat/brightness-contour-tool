import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface LabeledSliderProps {
  label: string
  /**
   * Accessible name, when the visible label is not self-explanatory on its own
   * (e.g. a bare '−' or '+' suffix). Defaults to `label`.
   */
  ariaLabel?: string
  value: number
  onChange: (value: number) => void
  /** Fired once when the user releases the handle — record undo here. */
  onCommit?: (value: number) => void
  min: number
  max: number
  step?: number
  /** Shown after the value, e.g. '%' or 'px'. */
  unit?: string
  disabled?: boolean
}

/** Standard settings-panel row: label left, value right, slider below. */
export function LabeledSlider({
  label,
  ariaLabel,
  value,
  onChange,
  onCommit,
  min,
  max,
  step = 1,
  unit = '',
  disabled,
}: LabeledSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => v !== undefined && onChange(v)}
        onValueCommit={onCommit ? ([v]) => v !== undefined && onCommit(v) : undefined}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        // The visible Label is not associated with the thumb, so name it here.
        aria-label={ariaLabel ?? label}
      />
    </div>
  )
}
