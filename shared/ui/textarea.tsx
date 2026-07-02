import * as React from "react";
import TextareaAutosizeComponent from "react-textarea-autosize";
import { cn } from "../lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof TextareaAutosizeComponent>
>(({ className, ...props }, ref) => {
  return (
    <TextareaAutosizeComponent
      className={cn(
        "bg-surface-base text-text-primary ring-offset-surface-base placeholder:text-text-muted flex field-sizing-content w-full resize-none text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };

