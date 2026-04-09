import { authApi } from "../../api/authApi";
import { tokenStorage } from "../../auth/tokenStorage";

export async function logoutUser(): Promise<void> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch {}
  }
  tokenStorage.clearTokens();
}
