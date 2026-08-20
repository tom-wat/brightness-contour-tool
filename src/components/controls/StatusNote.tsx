import { cn } from '@/lib/utils';

interface StatusNoteProps {
  children: React.ReactNode;
  /** Renders in the destructive color instead of muted. */
  error?: boolean;
}

/** One-line panel status text (loading, unavailable, failure reason). */
export function StatusNote({ children, error }: StatusNoteProps) {
  return (
    <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
      {children}
    </p>
  );
}
