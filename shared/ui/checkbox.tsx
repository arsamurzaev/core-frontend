"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-line-default dark:bg-surface-muted/30 data-[state=checked]:border-action-primary data-[state=checked]:bg-action-primary data-[state=checked]:text-action-primary-foreground dark:data-[state=checked]:bg-action-primary focus-visible:border-line-default focus-visible:ring-action-primary/50 aria-invalid:border-status-danger aria-invalid:ring-status-danger/20 dark:aria-invalid:ring-status-danger/40 size-4 shrink-0 rounded-[4px] border shadow-control transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
