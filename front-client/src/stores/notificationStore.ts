import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
}

const TOAST_DURATION_MS = 5000;
const TOAST_DEDUP_WINDOW_MS = 2500;

const autoDismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const toastKeyById = new Map<string, string>();
const activeToastIdsByKey = new Map<string, string>();
const lastToastShownAtByKey = new Map<string, number>();

function toastKey(tone: ToastTone, message: string): string {
  return `${tone}:${message.trim()}`;
}

function clearAutoDismiss(id: string): void {
  const t = autoDismissTimeouts.get(id);
  if (t !== undefined) {
    clearTimeout(t);
    autoDismissTimeouts.delete(id);
  }
}

function scheduleAutoDismiss(id: string): void {
  clearAutoDismiss(id);
  const t = setTimeout(() => {
    autoDismissTimeouts.delete(id);
    useNotificationStore.getState().dismissToast(id);
  }, TOAST_DURATION_MS);
  autoDismissTimeouts.set(id, t);
}

interface NotificationState {
  toasts: ToastItem[];
  pushToast: (tone: ToastTone, message: string) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

function createId(): string {
  return crypto.randomUUID();
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  pushToast: (tone, message) => {
    const key = toastKey(tone, message);
    const now = Date.now();
    const activeId = activeToastIdsByKey.get(key);
    if (activeId) {
      // Keep a single visible toast per tone+message pair.
      scheduleAutoDismiss(activeId);
      return;
    }

    const lastShownAt = lastToastShownAtByKey.get(key);
    if (lastShownAt !== undefined && now - lastShownAt < TOAST_DEDUP_WINDOW_MS) {
      return;
    }

    const id = createId();
    activeToastIdsByKey.set(key, id);
    toastKeyById.set(id, key);
    lastToastShownAtByKey.set(key, now);
    set((state) => ({
      toasts: [...state.toasts, { id, tone, message }],
    }));
    scheduleAutoDismiss(id);
  },
  dismissToast: (id) => {
    const key = toastKeyById.get(id);
    if (key) {
      activeToastIdsByKey.delete(key);
      toastKeyById.delete(id);
    }
    clearAutoDismiss(id);
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearToasts: () => {
    toastKeyById.clear();
    activeToastIdsByKey.clear();
    for (const id of autoDismissTimeouts.keys()) {
      clearAutoDismiss(id);
    }
    set({ toasts: [] });
  },
}));
