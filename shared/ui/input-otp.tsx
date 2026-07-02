"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { MinusIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

type OtpSlotState = {
  char?: string
  hasFakeCaret?: boolean
  isActive?: boolean
}

type OtpContextValue = {
  slots?: OtpSlotState[]
}

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext) as OtpContextValue
  const slot = inputOTPContext?.slots?.[index]
  const { char, hasFakeCaret, isActive } = slot ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "data-[active=true]:border-line-default data-[active=true]:ring-action-primary/50 data-[active=true]:aria-invalid:ring-status-danger/20 dark:data-[active=true]:aria-invalid:ring-status-danger/40 aria-invalid:border-status-danger data-[active=true]:aria-invalid:border-status-danger bg-surface-base dark:bg-surface-muted/30 border-line-default relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-control transition-all outline-none first:rounded-l-control first:border-l last:rounded-r-control data-[active=true]:z-10 data-[active=true]:ring-[3px]",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-text-primary h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
