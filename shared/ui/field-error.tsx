"use client"

import { useMemo } from "react"

import { cn } from "@/shared/lib/utils"

type FieldErrorEntry = { message?: string } | undefined

function getFieldErrorContent(params: {
  children: React.ReactNode
  errors?: FieldErrorEntry[]
}) {
  const { children, errors } = params

  if (children) {
    return children
  }

  if (!errors?.length) {
    return null
  }

  const uniqueErrors = [
    ...new Map(errors.map((error) => [error?.message, error])).values(),
  ]

  if (uniqueErrors.length === 1) {
    return uniqueErrors[0]?.message
  }

  return (
    <ul className="ml-4 flex list-disc flex-col gap-1">
      {uniqueErrors.map(
        (error, index) =>
          error?.message ? <li key={index}>{error.message}</li> : null
      )}
    </ul>
  )
}

export function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: FieldErrorEntry[]
}) {
  const content = useMemo(
    () => getFieldErrorContent({ children, errors }),
    [children, errors]
  )

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-destructive text-sm font-normal", className)}
      {...props}
    >
      {content}
    </div>
  )
}
