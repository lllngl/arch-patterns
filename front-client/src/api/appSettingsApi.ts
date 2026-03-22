import { getOrCreateDeviceId } from "../auth/deviceId";
import type { AppSettingsSyncResult, ClientAppSettingsDTO, ClientAppSettingsPatch } from "../contracts/app-settings";
import { clientAppSettingsSchema, userPreferencesResponseSchema } from "../contracts/schemas/appSettingsSchemas";
import { ApiError } from "../errors/ApiError";
import { httpClient } from "../network/httpClientSingleton";
import type { z } from "zod";

const PREFS_BASE = "/api/v1/preferences";

function prefsHeaders(): HeadersInit {
  return { "X-Device-Id": getOrCreateDeviceId() };
}

function apiThemeToUi(theme: string): ClientAppSettingsDTO["theme"] {
  if (theme === "DARK") {
    return "dark";
  }
  return "light";
}

function uiThemeToApi(theme: ClientAppSettingsDTO["theme"]): "LIGHT" | "DARK" {
  return theme === "dark" ? "DARK" : "LIGHT";
}

function mapResponse(row: z.infer<typeof userPreferencesResponseSchema>): ClientAppSettingsDTO {
  return {
    theme: apiThemeToUi(row.theme),
    hiddenAccountIds: row.hiddenAccountsIds,
  };
}

async function fetchPreferencesOrRegister(): Promise<z.infer<typeof userPreferencesResponseSchema>> {
  const headers = prefsHeaders();
  try {
    return await httpClient.requestJson(`${PREFS_BASE}`, {
      headers,
      parse: (r) => userPreferencesResponseSchema.parse(r),
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      const deviceId = getOrCreateDeviceId();
      return await httpClient.requestJson(`${PREFS_BASE}/devices`, {
        method: "POST",
        body: { deviceId },
        headers,
        parse: (r) => userPreferencesResponseSchema.parse(r),
      });
    }
    throw e;
  }
}

export const appSettingsApi = {
  async getSettings(): Promise<ClientAppSettingsDTO> {
    const disabled = import.meta.env.VITE_APP_SETTINGS_DISABLED === "true";
    if (disabled) {
      return readLocal();
    }
    try {
      const row = await fetchPreferencesOrRegister();
      return mapResponse(row);
    } catch {
      return readLocal();
    }
  },

  async patchSettings(patch: ClientAppSettingsPatch): Promise<AppSettingsSyncResult> {
    const disabled = import.meta.env.VITE_APP_SETTINGS_DISABLED === "true";
    if (disabled) {
      return { settings: mergeLocal(patch), syncedToServer: true };
    }
    try {
      const body: { theme?: string; hiddenAccountIds?: string[] } = {};
      if (patch.theme !== undefined) {
        body.theme = uiThemeToApi(patch.theme);
      }
      if (patch.hiddenAccountIds !== undefined) {
        body.hiddenAccountIds = patch.hiddenAccountIds;
      }
      const raw = await httpClient.requestJson<unknown>(`${PREFS_BASE}`, {
        method: "PATCH",
        headers: prefsHeaders(),
        body,
        parse: (r) => userPreferencesResponseSchema.parse(r),
      });
      return { settings: mapResponse(raw), syncedToServer: true };
    } catch {
      return { settings: mergeLocal(patch), syncedToServer: false };
    }
  },

  async hideAccount(accountId: string): Promise<AppSettingsSyncResult> {
    const disabled = import.meta.env.VITE_APP_SETTINGS_DISABLED === "true";
    if (disabled) {
      const cur = readLocal();
      const next = cur.hiddenAccountIds.includes(accountId)
        ? cur
        : { ...cur, hiddenAccountIds: [...cur.hiddenAccountIds, accountId] };
      writeLocal(next);
      return { settings: next, syncedToServer: true };
    }
    try {
      const raw = await httpClient.requestJson<unknown>(`${PREFS_BASE}/accounts/${accountId}/hide`, {
        method: "POST",
        headers: prefsHeaders(),
        parse: (r) => userPreferencesResponseSchema.parse(r),
      });
      return { settings: mapResponse(raw), syncedToServer: true };
    } catch {
      const cur = readLocal();
      const next = cur.hiddenAccountIds.includes(accountId)
        ? cur
        : { ...cur, hiddenAccountIds: [...cur.hiddenAccountIds, accountId] };
      writeLocal(next);
      return { settings: next, syncedToServer: false };
    }
  },

  async unhideAccount(accountId: string): Promise<AppSettingsSyncResult> {
    const disabled = import.meta.env.VITE_APP_SETTINGS_DISABLED === "true";
    if (disabled) {
      const cur = readLocal();
      const next = {
        ...cur,
        hiddenAccountIds: cur.hiddenAccountIds.filter((id) => id !== accountId),
      };
      writeLocal(next);
      return { settings: next, syncedToServer: true };
    }
    try {
      const raw = await httpClient.requestJson<unknown>(`${PREFS_BASE}/accounts/${accountId}/hide`, {
        method: "DELETE",
        headers: prefsHeaders(),
        parse: (r) => userPreferencesResponseSchema.parse(r),
      });
      return { settings: mapResponse(raw), syncedToServer: true };
    } catch {
      const cur = readLocal();
      const next = {
        ...cur,
        hiddenAccountIds: cur.hiddenAccountIds.filter((id) => id !== accountId),
      };
      writeLocal(next);
      return { settings: next, syncedToServer: false };
    }
  },
};

const LOCAL_KEY = "client_app_settings_v1";

function defaultSettings(): ClientAppSettingsDTO {
  return {
    theme: "light",
    hiddenAccountIds: [],
  };
}

function mergeLocal(patch: ClientAppSettingsPatch): ClientAppSettingsDTO {
  const stored = readLocal();
  const next: ClientAppSettingsDTO = {
    theme: patch.theme ?? stored.theme,
    hiddenAccountIds: patch.hiddenAccountIds ?? stored.hiddenAccountIds,
  };
  writeLocal(next);
  return next;
}

function readLocal(): ClientAppSettingsDTO {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      return defaultSettings();
    }
    const parsed: unknown = JSON.parse(raw);
    return clientAppSettingsSchema.parse(parsed) as ClientAppSettingsDTO;
  } catch {
    return defaultSettings();
  }
}

function writeLocal(value: ClientAppSettingsDTO): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(value));
}
