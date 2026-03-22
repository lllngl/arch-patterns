export type ThemeId = "light" | "dark";

export interface ClientAppSettingsDTO {
  theme: ThemeId;
  hiddenAccountIds: string[];
}

export interface ClientAppSettingsPatch {
  theme?: ThemeId;
  hiddenAccountIds?: string[];
}

/** Результат сохранения/чтения: сервер user-preferences или fallback на localStorage */
export interface AppSettingsSyncResult {
  settings: ClientAppSettingsDTO;
  /** `false` — ответа от сервера нет, использованы только локальные настройки */
  syncedToServer: boolean;
}
