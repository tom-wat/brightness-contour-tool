import { Faders, SquaresFour } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

interface AppShellProps {
  title: string
  /** Makes the title a button — used to start over. */
  onTitleClick?: () => void
  /** Buttons shown at the right end of the header (export, save…). */
  headerActions?: React.ReactNode
  /** Settings panel: left sidebar on desktop, bottom sheet on mobile. */
  leftPanel?: React.ReactNode
  leftPanelLabel?: string
  /** Display/results panel: right sidebar on desktop, bottom sheet on mobile. */
  rightPanel?: React.ReactNode
  rightPanelLabel?: string
  /** Canvas area. */
  children: React.ReactNode
}

function MobilePanelSheet({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="flex-1">
          {icon}
          {label}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <div className="pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Standard tool layout. Desktop: header, left settings sidebar, canvas,
 * right display sidebar. Mobile: header, canvas, bottom toolbar opening
 * each panel as a bottom sheet.
 */
export function AppShell({
  title,
  onTitleClick,
  headerActions,
  leftPanel,
  leftPanelLabel = 'Controls',
  rightPanel,
  rightPanelLabel = 'Display',
  children,
}: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-sm font-semibold">
          {onTitleClick ? (
            <button
              type="button"
              onClick={onTitleClick}
              className="rounded-sm hover:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              {title}
            </button>
          ) : (
            title
          )}
        </h1>
        <div className="flex items-center gap-2">
          {headerActions}
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {leftPanel && (
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-r lg:block">
            {leftPanel}
          </aside>
        )}
        <main className="relative min-w-0 flex-1">{children}</main>
        {rightPanel && (
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-l lg:block">
            {rightPanel}
          </aside>
        )}
      </div>

      {(leftPanel || rightPanel) && (
        <nav className="flex shrink-0 border-t lg:hidden">
          {leftPanel && (
            <MobilePanelSheet label={leftPanelLabel} icon={<Faders />}>
              {leftPanel}
            </MobilePanelSheet>
          )}
          {rightPanel && (
            <MobilePanelSheet label={rightPanelLabel} icon={<SquaresFour />}>
              {rightPanel}
            </MobilePanelSheet>
          )}
        </nav>
      )}
    </div>
  )
}
