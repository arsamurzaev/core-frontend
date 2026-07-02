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
      plain: "border-line-default",
      muted: "border-line-subtle bg-surface-subtle",
      translucent: "border-line-subtle bg-surface-raised/70",
      danger: "border-status-danger/35 bg-status-danger-surface",
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

export interface AdminPanelSectionProps
  extends
    React.HTMLAttributes<HTMLElement>,
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

const AdminPanelSection = React.forwardRef<
  HTMLElement,
  AdminPanelSectionProps
>(({ className, elevation, padding, variant, ...props }, ref) => (
  <section
    ref={ref}
    className={cn(
      adminPanelVariants({ elevation, padding, variant }),
      className,
    )}
    {...props}
  />
));
AdminPanelSection.displayName = "AdminPanelSection";

const AdminPanelHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-start gap-3", className)}
    {...props}
  />
));
AdminPanelHeader.displayName = "AdminPanelHeader";

const AdminPanelHeaderContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("min-w-0 space-y-1", className)} {...props} />
));
AdminPanelHeaderContent.displayName = "AdminPanelHeaderContent";

const AdminPanelTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-base font-semibold", className)}
    {...props}
  />
));
AdminPanelTitle.displayName = "AdminPanelTitle";

const AdminPanelDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm leading-5 text-text-muted", className)}
    {...props}
  />
));
AdminPanelDescription.displayName = "AdminPanelDescription";

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
  AdminPanelDescription,
  AdminPanelHeader,
  AdminPanelHeaderContent,
  AdminPanelSection,
  AdminPanelTitle,
  adminPanelButtonVariants,
  adminPanelVariants,
};
