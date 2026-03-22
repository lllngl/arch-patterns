export type ThemeId = "light" | "dark";

export interface ClientAppSettingsDTO {
  theme: ThemeId;
  hiddenAccountIds: string[];
  version: number;
}

export interface ClientAppSettingsPatch {
  theme?: ThemeId;
  hiddenAccountIds?: string[];
}
