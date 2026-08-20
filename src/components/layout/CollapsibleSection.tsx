import { CaretDown } from '@phosphor-icons/react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

/** Titled, collapsible group inside a side panel. */
export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-b px-4 py-3">
      <CollapsibleTrigger className="group flex w-full items-center justify-between text-sm font-semibold">
        {title}
        <CaretDown
          size={14}
          className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}
