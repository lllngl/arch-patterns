import axios from "axios";
import { create } from "zustand";
import { preferencesApi, getOrCreateDeviceId } from "@/api/preferences";
import type { PreferenceTheme } from "@/types";
import { getErrorMessage } from "@/lib/http-error";

export type AppTheme = "light" | "dark";
export type SettingsSyncState =
  | "idle"
  | "syncing"
  | "synced"
  | "local-only"
  | "blocked";

interface PersistedSettings {
  theme: AppTheme;
  hiddenAccountIds: string[];
}

interface AppSettingsState extends PersistedSettings {
  syncState: SettingsSyncState;
  syncMessage: string;
  bootstrap: (userId: string | null | undefined) => Promise<void>;
  setTheme: (theme: AppTheme) => Promise<void>;
  toggleHiddenAccount: (accountId: string) => Promise<void>;
  isAccountHidden: (accountId: string) => boolean;
}

const DEFAULT_SETTINGS: PersistedSettings = {
  theme: "light",
  hiddenAccountIds: [],
};

let activeStorageKey = "front-employee:settings:guest";
let activeDeviceId = "";

function getStorageKey(userId: string | null | undefined) {
  return `front-employee:settings:${userId ?? "guest"}`;
}

function readSettings(storageKey: string): PersistedSettings {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      theme:
        parsed.theme === "light" ||
        parsed.theme === "dark"
          ? parsed.theme
          : DEFAULT_SETTINGS.theme,
      hiddenAccountIds: Array.isArray(parsed.hiddenAccountIds)
        ? parsed.hiddenAccountIds.filter((value): value is string => typeof value === "string")
        : [],
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: PersistedSettings) {
  localStorage.setItem(activeStorageKey, JSON.stringify(settings));
}

function mapApiTheme(theme: PreferenceTheme): AppTheme {
  return theme === "DARK" ? "dark" : "light";
}

function mapUiTheme(theme: AppTheme): PreferenceTheme {
  return theme === "dark" ? "DARK" : "LIGHT";
}

function normalizeHiddenAccountIds(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function saveAndSet(
  set: (state: Partial<AppSettingsState>) => void,
  settings: PersistedSettings,
  syncState: SettingsSyncState,
  syncMessage: string
) {
  writeSettings(settings);
  set({
    ...settings,
    syncState,
    syncMessage,
  });
}

export const useAppSettingsStore = create<AppSettingsState>()((set, get) => ({
  ...DEFAULT_SETTINGS,
  syncState: "idle",
  syncMessage: "Настройки приложения ещё не синхронизированы.",

  bootstrap: async (userId) => {
    activeStorageKey = getStorageKey(userId);
    activeDeviceId = getOrCreateDeviceId();
    const persisted = readSettings(activeStorageKey);

    if (!userId) {
      set({
        ...persisted,
        syncState: "idle",
        syncMessage: "Войдите в систему, чтобы загрузить настройки устройства.",
      });
      return;
    }

    set({
      ...persisted,
      syncState: "syncing",
      syncMessage: "Загружаем настройки приложения с сервера.",
    });

    try {
      const { data } = await preferencesApi.get(activeDeviceId);
      saveAndSet(
        set,
        {
          theme: mapApiTheme(data.theme),
          hiddenAccountIds: normalizeHiddenAccountIds(data.hiddenAccountsIds),
        },
        "synced",
        "Настройки текущего устройства загружены из user-preferences-service."
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        try {
          const { data } = await preferencesApi.registerDevice(activeDeviceId);
          saveAndSet(
            set,
            {
              theme: mapApiTheme(data.theme),
              hiddenAccountIds: normalizeHiddenAccountIds(data.hiddenAccountsIds),
            },
            "synced",
            "Устройство зарегистрировано, серверные настройки для него созданы."
          );
          return;
        } catch (registerError) {
          saveAndSet(
            set,
            persisted,
            "local-only",
            `Не удалось зарегистрировать устройство: ${getErrorMessage(registerError)}`
          );
          return;
        }
      }

      saveAndSet(
        set,
        persisted,
        "local-only",
        `Серверная синхронизация недоступна: ${getErrorMessage(error)}`
      );
    }
  },

  setTheme: async (theme) => {
    const nextState: PersistedSettings = {
      theme,
      hiddenAccountIds: get().hiddenAccountIds,
    };

    saveAndSet(set, nextState, "syncing", "Сохраняем тему на сервере.");

    try {
      await preferencesApi.updateTheme(activeDeviceId, mapUiTheme(theme));
      saveAndSet(
        set,
        nextState,
        "synced",
        "Тема сохранена для текущего устройства."
      );
    } catch (error) {
      saveAndSet(
        set,
        nextState,
        "local-only",
        `Тема сохранена только локально: ${getErrorMessage(error)}`
      );
    }
  },

  toggleHiddenAccount: async (accountId) => {
    const wasHidden = get().hiddenAccountIds.includes(accountId);
    const hiddenAccountIds = wasHidden
      ? get().hiddenAccountIds.filter((value) => value !== accountId)
      : [...get().hiddenAccountIds, accountId];

    const nextState: PersistedSettings = {
      theme: get().theme,
      hiddenAccountIds,
    };

    saveAndSet(set, nextState, "syncing", "Сохраняем список скрытых счетов.");

    try {
      if (wasHidden) {
        await preferencesApi.unhideAccount(activeDeviceId, accountId);
      } else {
        await preferencesApi.hideAccount(activeDeviceId, accountId);
      }

      saveAndSet(
        set,
        nextState,
        "synced",
        "Список скрытых счетов сохранён для текущего устройства."
      );
    } catch (error) {
      saveAndSet(
        set,
        nextState,
        "local-only",
        `Скрытие счёта сохранено только локально: ${getErrorMessage(error)}`
      );
    }
  },

  isAccountHidden: (accountId) => get().hiddenAccountIds.includes(accountId),
}));
