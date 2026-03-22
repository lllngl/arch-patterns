import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
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
  pushToast: (tone, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: createId(), tone, message }],
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));
