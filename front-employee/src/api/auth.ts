import axios from "axios";
import type { AuthRequest, AuthResponse } from "@/types";

export const authApi = {
  login(data: AuthRequest) {
    return axios.post<AuthResponse>("/api/v1/auth/authenticate", data);
  },

  refresh(refreshToken: string) {
    return axios.post<AuthResponse>("/api/v1/auth/refresh", { refreshToken });
  },

  logout(refreshToken: string) {
    return axios.post("/api/v1/auth/logout", { refreshToken });
  },
};
