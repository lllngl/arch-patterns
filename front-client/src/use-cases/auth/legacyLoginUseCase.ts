import { authApi } from "../../api/authApi";
import { tokenStorage } from "../../auth/tokenStorage";
import type { UserProfile } from "../../contracts/auth";
import { loadUserProfileForClientApp } from "./sessionUseCase";

/**
 * Только для локальной разработки, пока нет SSO. Выключается по умолчанию.
 */
export function isLegacyPasswordLoginEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_LEGACY_PASSWORD_LOGIN === "true";
}

export async function loginWithPasswordForDev(login: string, password: string): Promise<UserProfile> {
  if (!isLegacyPasswordLoginEnabled()) {
    throw new Error("Ввод пароля в этом приложении отключён. Используйте единый сервис аутентификации (OAuth).");
  }
  const tokens = await authApi.login({ login, password });
  tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
  return loadUserProfileForClientApp();
}
