import { cn } from '@/lib/utils'

interface ToggleChipProps {
  label: string
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  disabled?: boolean
}

/** Compact pill toggle for switching layers/options on and off. */
export function ToggleChip({ label, pressed, onPressedChange, disabled }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        pressed
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
      )}
    >
      {label}
    </button>
  )
}
