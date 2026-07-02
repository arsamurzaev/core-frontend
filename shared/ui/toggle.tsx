"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium hover:bg-surface-muted hover:text-text-muted disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-surface-muted data-[state=on]:text-text-primary [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-line-default focus-visible:ring-action-primary/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:border-status-danger aria-invalid:ring-status-danger/20 dark:aria-invalid:ring-status-danger/40 whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-line-default bg-transparent shadow-control hover:bg-surface-muted hover:text-text-primary",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
