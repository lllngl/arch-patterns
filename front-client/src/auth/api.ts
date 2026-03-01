import { tokenStorage } from "./tokenStorage";
import type { AuthRequest, AuthResponse, UserProfile } from "./types";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data === "string") {
      return data;
    }
    if (typeof data?.message === "string") {
      return data.message;
    }
    if (typeof data?.error === "string") {
      return data.error;
    }
  } catch {
    //
  }
  return `Request failed with status ${response.status}`;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.clearTokens();
    return null;
  }

  try {
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      tokenStorage.clearTokens();
      return null;
    }

    const data = (await response.json()) as AuthResponse;
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  if (requiresAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  let response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  if (response.status === 401 && requiresAuth) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }

    const newToken = await refreshPromise;
    refreshPromise = null;

    if (!newToken) {
      throw new ApiError(401, "Unauthorized");
    }

    requestHeaders.set("Authorization", `Bearer ${newToken}`);
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export const authApi = {
  login(data: AuthRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/api/v1/auth/authenticate", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify(data),
    });
  },

  logout(refreshToken: string): Promise<void> {
    return apiRequest<void>("/api/v1/auth/logout", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify({ refreshToken }),
    });
  },

  getMyProfile(): Promise<UserProfile> {
    return apiRequest<UserProfile>("/api/v1/users/profile");
  },
};

export { ApiError };
