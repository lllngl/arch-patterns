import { authApi } from "../../api/authApi";
import { ApiError } from "../../errors/ApiError";
import { tokenStorage } from "../../auth/tokenStorage";
import type { UserProfile } from "../../contracts/auth";

export async function loadUserProfileForClientApp(): Promise<UserProfile> {
  const profile = await authApi.getMyProfile();
  if (profile.role !== "CLIENT") {
    tokenStorage.clearTokens();
    throw new ApiError(403, "Это приложение доступно только клиентам (роль CLIENT).");
  }
  return profile;
}

export async function restoreSessionIfPossible(): Promise<UserProfile | null> {
  const accessToken = tokenStorage.getAccessToken();
  if (!accessToken) {
    return null;
  }
  try {
    return await loadUserProfileForClientApp();
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}
