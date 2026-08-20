import { CircleNotch } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface ApplyButtonProps {
  label: string;
  onClick: () => void;
  processing?: boolean;
  disabled?: boolean;
}

/** Full-width "run this processing step" button with a busy state. */
export function ApplyButton({ label, onClick, processing, disabled }: ApplyButtonProps) {
  return (
    <Button className="w-full" onClick={onClick} disabled={disabled || processing}>
      {processing && <CircleNotch className="animate-spin" />}
      {processing ? 'Processing…' : label}
    </Button>
  );
}
