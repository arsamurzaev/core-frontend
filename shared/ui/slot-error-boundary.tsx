"use client";

import { getUserFacingError } from "@/shared/lib/user-facing-error";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  slotId: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SlotErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[SlotError] ${this.props.slotId}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const userFacingError = getUserFacingError(this.state.error);

      return (
        this.props.fallback || (
          <div className="rounded-md border bg-secondary/60 p-3 text-sm">
            <p className="font-medium">{userFacingError.title}</p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              {userFacingError.description}
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
