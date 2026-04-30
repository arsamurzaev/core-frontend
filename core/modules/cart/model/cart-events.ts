import type { CartDto } from "@/shared/api/generated/react-query";

type CartRealtimeEvent = {
  type: string;
  data: unknown;
};

export function isInactiveSharedCartStatus(
  status: CartDto["status"] | null | undefined,
) {
  return (
    status === "CONVERTED" ||
    status === "CANCELLED" ||
    status === "EXPIRED"
  );
}

export function isCartUpdatedEvent(
  event: CartRealtimeEvent,
): event is { type: "cart.updated"; data: CartDto } {
  return event.type === "cart.updated";
}

export function isCartSnapshotEvent(
  event: CartRealtimeEvent,
): event is { type: "cart.snapshot"; data: CartDto } {
  return event.type === "cart.snapshot";
}

export function isCartStatusChangedEvent(
  event: CartRealtimeEvent,
): event is { type: "cart.status_changed"; data: CartDto } {
  return event.type === "cart.status_changed";
}

export function isCartDetachedEvent(
  event: CartRealtimeEvent,
): event is { type: "cart.detached"; data: unknown } {
  return event.type === "cart.detached";
}
