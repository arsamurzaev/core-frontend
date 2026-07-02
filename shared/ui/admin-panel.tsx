import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Button, type ButtonProps } from "@/shared/ui/button";

const adminPanelVariants = cva("rounded-panel border text-text-primary", {
  variants: {
    elevation: {
      none: "",
      surface: "shadow-surface",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
    variant: {
      default: "border-line-subtle bg-surface-raised",
      muted: "border-line-subtle bg-surface-subtle",
      translucent: "border-line-subtle bg-surface-raised/70",
      dashed:
        "border-dashed border-line-subtle bg-surface-subtle text-text-muted",
    },
  },
  defaultVariants: {
    elevation: "none",
    padding: "md",
    variant: "default",
  },
});

export interface AdminPanelProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof adminPanelVariants> {}

const adminPanelButtonVariants = cva(
  "h-auto w-full min-w-0 items-start justify-between rounded-panel border px-4 py-4 text-left whitespace-normal",
  {
    variants: {
      tone: {
        default: "border-line-subtle hover:bg-surface-muted/50",
        muted: "border-line-subtle bg-surface-subtle hover:bg-surface-muted/60",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export interface AdminPanelButtonProps
  extends
    Omit<ButtonProps, "variant">,
    VariantProps<typeof adminPanelButtonVariants> {}

const AdminPanel = React.forwardRef<HTMLDivElement, AdminPanelProps>(
  ({ className, elevation, padding, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        adminPanelVariants({ elevation, padding, variant }),
        className,
      )}
      {...props}
    />
  ),
);
AdminPanel.displayName = "AdminPanel";

const AdminPanelButton = React.forwardRef<
  HTMLButtonElement,
  AdminPanelButtonProps
>(({ className, tone, ...props }, ref) => (
  <Button
    ref={ref}
    type="button"
    variant="ghost"
    className={cn(adminPanelButtonVariants({ tone }), className)}
    {...props}
  />
));
AdminPanelButton.displayName = "AdminPanelButton";

export {
  AdminPanel,
  AdminPanelButton,
  adminPanelButtonVariants,
  adminPanelVariants,
};
