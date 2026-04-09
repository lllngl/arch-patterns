import { create } from "zustand";
import { appSettingsApi } from "../api/appSettingsApi";
import type { ThemeId } from "../contracts/app-settings";
import { useNotificationStore } from "./notificationStore";

interface AppSettingsState {
  theme: ThemeId;
  hiddenAccountIds: string[];
  isLoading: boolean;
  load: () => Promise<void>;
  setTheme: (theme: ThemeId) => Promise<void>;
  toggleHiddenAccount: (accountId: string) => Promise<void>;
}

function applyThemeToDom(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme;
}

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  theme: "light",
  hiddenAccountIds: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const s = await appSettingsApi.getSettings();
      applyThemeToDom(s.theme);
      set({ theme: s.theme, hiddenAccountIds: s.hiddenAccountIds });
    } finally {
      set({ isLoading: false });
    }
  },

  setTheme: async (theme) => {
    applyThemeToDom(theme);
    set({ theme });
    const { settings: next, syncedToServer } = await appSettingsApi.patchSettings({ theme });
    set({ theme: next.theme, hiddenAccountIds: next.hiddenAccountIds });
    if (!syncedToServer) {
      useNotificationStore.getState().pushToast(
        "info",
        "Тема сохранена только в этом браузере. Для синхронизации между устройствами (требование курса) нужен user-preferences-service на порту 9010.",
      );
    }
  },

  toggleHiddenAccount: async (accountId) => {
    const { hiddenAccountIds } = get();
    const has = hiddenAccountIds.includes(accountId);
    const { settings: next, syncedToServer } = has
      ? await appSettingsApi.unhideAccount(accountId)
      : await appSettingsApi.hideAccount(accountId);
    applyThemeToDom(next.theme);
    set({ theme: next.theme, hiddenAccountIds: next.hiddenAccountIds });
    if (!syncedToServer) {
      useNotificationStore.getState().pushToast(
        "info",
        "Список скрытых счетов сохранён только в этом браузере. Запустите user-preferences-service (9010), чтобы синхронизировать с сервером.",
      );
    }
  },
}));
