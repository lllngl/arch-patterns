import { api } from "./client";
import type {
  PreferenceTheme,
  UpdatePreferencesRequest,
  UserPreferencesResponse,
} from "@/types";

const DEVICE_ID_STORAGE_KEY = "front-employee:device-id";

export function getOrCreateDeviceId() {
  const existingValue = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existingValue) {
    return existingValue;
  }

  const createdValue = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, createdValue);
  return createdValue;
}

function buildHeaders(deviceId: string) {
  return {
    "X-Device-Id": deviceId,
  };
}

export const preferencesApi = {
  get(deviceId: string) {
    return api.get<UserPreferencesResponse>("/api/v1/preferences", {
      headers: buildHeaders(deviceId),
    });
  },

  registerDevice(deviceId: string) {
    return api.post<UserPreferencesResponse>("/api/v1/preferences/devices", {
      deviceId,
    });
  },

  registerPushToken(deviceId: string, pushToken: string) {
    return api.put<UserPreferencesResponse>(
      `/api/v1/preferences/devices/${deviceId}/push-token`,
      {
        pushToken,
      }
    );
  },

  unregisterPushToken(deviceId: string) {
    return api.delete(`/api/v1/preferences/devices/${deviceId}/push-token`);
  },

  update(deviceId: string, data: UpdatePreferencesRequest) {
    return api.patch<UserPreferencesResponse>("/api/v1/preferences", data, {
      headers: buildHeaders(deviceId),
    });
  },

  updateTheme(deviceId: string, theme: PreferenceTheme) {
    return api.patch<UserPreferencesResponse>("/api/v1/preferences/theme", null, {
      headers: buildHeaders(deviceId),
      params: { theme },
    });
  },

  hideAccount(deviceId: string, accountId: string) {
    return api.post<UserPreferencesResponse>(
      `/api/v1/preferences/accounts/${accountId}/hide`,
      null,
      {
        headers: buildHeaders(deviceId),
      }
    );
  },

  unhideAccount(deviceId: string, accountId: string) {
    return api.delete<UserPreferencesResponse>(
      `/api/v1/preferences/accounts/${accountId}/hide`,
      {
        headers: buildHeaders(deviceId),
      }
    );
  },
};
