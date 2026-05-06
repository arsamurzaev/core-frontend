"use client";

import { FORWARDED_HOST_HEADER, getForwardedHost } from "@/shared/api/client";
import { buildAbsoluteApiUrl } from "@/shared/api/client-request";
import {
  type CartDto,
  getCartControllerSseCurrentQueryKey,
  getCartControllerSsePublicQueryKey,
} from "./react-query/index";

export interface CartSseConnectedEvent {
  id?: string;
  type: "connected";
  data: {
    cartId: string;
    timestamp: string;
  };
}

export interface CartSsePingEvent {
  id?: string;
  type: "ping";
  data: {
    timestamp: string;
  };
}

export interface CartSseSnapshotEvent {
  id?: string;
  type: "cart.snapshot";
  data: CartDto;
}

export interface CartSseUpdatedEvent {
  id?: string;
  type: "cart.updated";
  data: CartDto;
}

export interface CartSseStatusChangedEvent {
  id?: string;
  type: "cart.status_changed";
  data: CartDto;
}

export interface CartSseDetachedEvent {
  id?: string;
  type: "cart.detached";
  data: unknown;
}

export interface CartSseUnknownEvent {
  id?: string;
  type: string;
  data: unknown;
}

export type CartSseEvent =
  | CartSseConnectedEvent
  | CartSsePingEvent
  | CartSseSnapshotEvent
  | CartSseUpdatedEvent
  | CartSseStatusChangedEvent
  | CartSseDetachedEvent
  | CartSseUnknownEvent;

export class CartSseConnectionError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CartSseConnectionError";
    this.status = status;
  }
}

interface ConnectCartSseOptions {
  lastEventId?: string | null;
  onEvent: (event: CartSseEvent) => void;
  signal?: AbortSignal;
}

function toAbsoluteApiUrl(path: string, params?: Record<string, unknown>) {
  return buildAbsoluteApiUrl(path, params);
}

async function createSseHeaders(lastEventId?: string | null) {
  const headers = new Headers({ Accept: "text/event-stream" });
  const forwardedHost = await getForwardedHost();

  if (forwardedHost) {
    headers.set(FORWARDED_HOST_HEADER, forwardedHost);
  }

  if (lastEventId) {
    headers.set("Last-Event-ID", lastEventId);
  }

  return headers;
}

function parseCartSseChunk(chunk: string): CartSseEvent | null {
  const lines = chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  let eventType = "message";
  let eventId: string | undefined;
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("id:")) {
      eventId = line.slice("id:".length).trim() || undefined;
      continue;
    }

    if (line.startsWith("event:")) {
      eventType = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const rawData = dataLines.join("\n");
  if (!rawData || rawData === "[DONE]") {
    return null;
  }

  try {
    return {
      ...(eventId ? { id: eventId } : {}),
      type: eventType,
      data: JSON.parse(rawData) as unknown,
    } as CartSseEvent;
  } catch {
    return {
      ...(eventId ? { id: eventId } : {}),
      type: eventType,
      data: rawData,
    };
  }
}

async function connectCartSse(
  url: string,
  options: ConnectCartSseOptions,
): Promise<void> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: await createSseHeaders(options.lastEventId),
    cache: "no-store",
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    throw new CartSseConnectionError(
      `Cart SSE is not available (${response.status}).`,
      response.status,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split(/\r?\n\r?\n/);
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const event = parseCartSseChunk(chunk);
        if (event) {
          options.onEvent(event);
        }
      }
    }

    const trailingEvent = parseCartSseChunk(buffer);
    if (trailingEvent) {
      options.onEvent(trailingEvent);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export function buildCartControllerSseCurrentUrl() {
  const [path] = getCartControllerSseCurrentQueryKey();
  return toAbsoluteApiUrl(path);
}

export function buildCartControllerSsePublicUrl(
  publicKey: string,
) {
  const [path] = getCartControllerSsePublicQueryKey(publicKey);

  return toAbsoluteApiUrl(path);
}

export async function connectCartControllerSseCurrent(
  options: ConnectCartSseOptions,
) {
  return connectCartSse(buildCartControllerSseCurrentUrl(), options);
}

export async function connectCartControllerSsePublic(
  publicKey: string,
  options: ConnectCartSseOptions,
) {
  return connectCartSse(buildCartControllerSsePublicUrl(publicKey), options);
}
