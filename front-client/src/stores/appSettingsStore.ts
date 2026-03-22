import { create } from "zustand";
import { appSettingsApi } from "../api/appSettingsApi";
import type { ThemeId } from "../contracts/app-settings";

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
    const prev = get();
    applyThemeToDom(theme);
    set({ theme });
    const next = await appSettingsApi.patchSettings({ theme });
    set({ theme: next.theme, hiddenAccountIds: next.hiddenAccountIds });
  },

  toggleHiddenAccount: async (accountId) => {
    const { hiddenAccountIds } = get();
    const has = hiddenAccountIds.includes(accountId);
    const nextIds = has ? hiddenAccountIds.filter((id) => id !== accountId) : [...hiddenAccountIds, accountId];
    set({ hiddenAccountIds: nextIds });
    const next = await appSettingsApi.patchSettings({ hiddenAccountIds: nextIds });
    set({ hiddenAccountIds: next.hiddenAccountIds, theme: next.theme });
  },
}));
