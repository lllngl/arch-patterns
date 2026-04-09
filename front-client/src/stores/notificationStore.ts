import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
}

const TOAST_DURATION_MS = 5000;

const autoDismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function clearAutoDismiss(id: string): void {
  const t = autoDismissTimeouts.get(id);
  if (t !== undefined) {
    clearTimeout(t);
    autoDismissTimeouts.delete(id);
  }
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
    const id = createId();
    set((state) => ({
      toasts: [...state.toasts, { id, tone, message }],
    }));
    const t = setTimeout(() => {
      autoDismissTimeouts.delete(id);
      useNotificationStore.getState().dismissToast(id);
    }, TOAST_DURATION_MS);
    autoDismissTimeouts.set(id, t);
  },
  dismissToast: (id) => {
    clearAutoDismiss(id);
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearToasts: () => {
    for (const id of autoDismissTimeouts.keys()) {
      clearAutoDismiss(id);
    }
    set({ toasts: [] });
  },
}));
