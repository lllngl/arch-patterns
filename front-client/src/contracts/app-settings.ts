export type ThemeId = "light" | "dark";

/**
 * Настройки UI приложения, синхронизируемые с серверной частью приложения (BFF настроек).
 */
export interface ClientAppSettingsDTO {
  theme: ThemeId;
  hiddenAccountIds: string[];
  version: number;
}

export interface ClientAppSettingsPatch {
  theme?: ThemeId;
  hiddenAccountIds?: string[];
}
