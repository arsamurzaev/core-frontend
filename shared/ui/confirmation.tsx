"use client";

import type { ConfirmationDrawerProps } from "@/shared/ui/confirmation-drawer";
import { ConfirmationDrawer } from "@/shared/ui/confirmation-drawer";
import * as React from "react";

type AsyncVoid = void | Promise<void>;

type ConfirmationOptions = Omit<
  ConfirmationDrawerProps,
  | "open"
  | "defaultOpen"
  | "onOpenChange"
  | "trigger"
  | "onConfirm"
  | "onCancel"
  | "onError"
  | "closeOnConfirm"
  | "closeOnCancel"
> & {
  onConfirm?: () => AsyncVoid;
  onCancel?: () => AsyncVoid;
  onError?: (error: unknown) => void;
};

type ConfirmationRequest = ConfirmationOptions & {
  id: number;
  resolve: (result: boolean) => void;
  resolved?: boolean;
};

type ConfirmationState = {
  request: ConfirmationRequest | null;
  open: boolean;
};

type Listener = () => void;

let idSequence = 0;
let state: ConfirmationState = { request: null, open: false };
const queue: ConfirmationRequest[] = [];
const listeners = new Set<Listener>();

const DEFAULT_DELETE_OPTIONS: ConfirmationOptions = {
  title: "Удалить?",
  description: "Действие нельзя отменить.",
  confirmText: "Да, удалить",
  cancelText: "Отмена",
  tone: "default",
};

const DEFAULT_SAVE_OPTIONS: ConfirmationOptions = {
  title: "Сохранить изменения?",
  description: "Текущие данные будут обновлены.",
  confirmText: "Сохранить",
  cancelText: "Отмена",
  tone: "default",
};

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(next: Partial<ConfirmationState>) {
  state = { ...state, ...next };
  notify();
}

function setCurrent(next: ConfirmationRequest | null) {
  state = { request: next, open: Boolean(next) };
  notify();
}

function showNext() {
  if (state.request || queue.length === 0) return;
  setCurrent(queue.shift() ?? null);
}

function resolveCurrent(result: boolean) {
  const request = state.request;
  if (!request || request.resolved) return;
  request.resolved = true;
  request.resolve(result);
  setState({ open: false });
}

function clearCurrent() {
  if (!state.request) return;
  setState({ request: null, open: false });
  showNext();
}

export function confirm(options: ConfirmationOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const request: ConfirmationRequest = {
      id: ++idSequence,
      resolve,
      ...options,
    };
    queue.push(request);
    showNext();
  });
}

export function confirmDelete(options: ConfirmationOptions = {}) {
  return confirm({ ...DEFAULT_DELETE_OPTIONS, ...options });
}

export function confirmSave(options: ConfirmationOptions = {}) {
  return confirm({ ...DEFAULT_SAVE_OPTIONS, ...options });
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function useConfirmationState() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function ConfirmationProvider() {
  const { request, open } = useConfirmationState();

  const handleConfirm = React.useCallback(async () => {
    if (!request) return;
    if (request.onConfirm) {
      await request.onConfirm();
    }
    resolveCurrent(true);
  }, [request]);

  const handleCancel = React.useCallback(async () => {
    if (!request) return;
    try {
      await request.onCancel?.();
    } catch (error) {
      request.onError?.(error);
    }
    resolveCurrent(false);
  }, [request]);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) void handleCancel();
    },
    [handleCancel],
  );

  const handleAfterClose = React.useCallback(() => {
    if (!request || open) return;
    try {
      request.onAfterClose?.();
    } catch (error) {
      request.onError?.(error);
    }
    clearCurrent();
  }, [request, open]);

  return (
    <ConfirmationDrawer
      open={open}
      onOpenChange={handleOpenChange}
      onAfterClose={request ? handleAfterClose : undefined}
      closeOnConfirm={false}
      closeOnCancel={false}
      preventCloseWhilePending={request?.preventCloseWhilePending ?? true}
      title={request?.title}
      description={request?.description}
      icon={request?.icon}
      footer={request?.footer}
      confirmText={request?.confirmText}
      cancelText={request?.cancelText}
      pendingText={request?.pendingText}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onError={request?.onError}
      tone={request?.tone}
      confirmVariant={request?.confirmVariant}
      cancelVariant={request?.cancelVariant}
      confirmSize={request?.confirmSize}
      cancelSize={request?.cancelSize}
      confirmButtonProps={request?.confirmButtonProps}
      cancelButtonProps={request?.cancelButtonProps}
      confirmDisabled={request?.confirmDisabled}
      cancelDisabled={request?.cancelDisabled}
      hideConfirm={request?.hideConfirm}
      hideCancel={request?.hideCancel}
      drawerProps={request?.drawerProps}
      contentClassName={request?.contentClassName}
      headerClassName={request?.headerClassName}
      titleClassName={request?.titleClassName}
      descriptionClassName={request?.descriptionClassName}
      bodyClassName={request?.bodyClassName}
      footerClassName={request?.footerClassName}
    >
      {request?.children}
    </ConfirmationDrawer>
  );
}

export type { ConfirmationOptions };
