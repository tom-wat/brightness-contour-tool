import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ColorRowProps {
  label: string
  /** Hex color like '#ff8800'. */
  value: string
  onChange: (hex: string) => void
  disabled?: boolean
}

/** Settings-panel row for picking a color: label, swatch picker, hex field. */
export function ColorRow({ label, value, onChange, disabled }: ColorRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          aria-label={`${label} color`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-7 w-9 cursor-pointer rounded border bg-background p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => {
            const hex = e.target.value
            if (/^#[0-9a-fA-F]{6}$/.test(hex)) onChange(hex)
          }}
          disabled={disabled}
          className="h-7 w-20 px-2 font-mono text-xs"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  )
}
