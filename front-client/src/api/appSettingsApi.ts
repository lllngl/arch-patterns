import type { ClientAppSettingsDTO, ClientAppSettingsPatch } from "../contracts/app-settings";
import { clientAppSettingsSchema } from "../contracts/schemas/appSettingsSchemas";
import { httpClient } from "../network/httpClientSingleton";

const SETTINGS_BASE = "/api/v1/client-app/settings";

export const appSettingsApi = {
  async getSettings(): Promise<ClientAppSettingsDTO> {
    const disabled = import.meta.env.VITE_APP_SETTINGS_DISABLED === "true";
    if (disabled) {
      return defaultSettings();
    }
    try {
      return await httpClient.requestJson<ClientAppSettingsDTO>(SETTINGS_BASE, {
        parse: (raw) => clientAppSettingsSchema.parse(raw),
      });
    } catch {
      return defaultSettings();
    }
  },

  async patchSettings(patch: ClientAppSettingsPatch): Promise<ClientAppSettingsDTO> {
    const disabled = import.meta.env.VITE_APP_SETTINGS_DISABLED === "true";
    if (disabled) {
      return mergeLocal(patch);
    }
    try {
      return await httpClient.requestJson<ClientAppSettingsDTO>(SETTINGS_BASE, {
        method: "PATCH",
        body: patch,
        parse: (raw) => clientAppSettingsSchema.parse(raw),
      });
    } catch {
      return mergeLocal(patch);
    }
  },
};

function defaultSettings(): ClientAppSettingsDTO {
  return {
    theme: "light",
    hiddenAccountIds: [],
    version: 1,
  };
}

function mergeLocal(patch: ClientAppSettingsPatch): ClientAppSettingsDTO {
  const stored = readLocal();
  const next: ClientAppSettingsDTO = {
    theme: patch.theme ?? stored.theme,
    hiddenAccountIds: patch.hiddenAccountIds ?? stored.hiddenAccountIds,
    version: stored.version + 1,
  };
  writeLocal(next);
  return next;
}

const LOCAL_KEY = "client_app_settings_v1";

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
