import { api } from "./client";
import type {
  UserDTO,
  UserRegisterDTO,
  UserEditDTO,
  Page,
  PageRequestParams,
  RoleName,
  Gender,
} from "@/types";

export interface UsersFilterParams extends PageRequestParams {
  username?: string;
  email?: string;
  gender?: Gender;
  isBlocked?: boolean;
}

export const usersApi = {
  getAll(params: UsersFilterParams = {}) {
    return api.get<Page<UserDTO>>("/api/v1/users", { params });
  },

  getById(userId: string) {
    return api.get<UserDTO>(`/api/v1/users/${userId}`);
  },

  getMyProfile() {
    return api.get<UserDTO>("/api/v1/users/profile");
  },

  create(data: UserRegisterDTO, role: RoleName) {
    return api.post<UserDTO>("/api/v1/users/create", data, {
      params: { role },
    });
  },

  update(userId: string, data: UserEditDTO) {
    return api.put<UserDTO>(`/api/v1/users/${userId}`, data);
  },

  delete(userId: string) {
    return api.delete(`/api/v1/users/${userId}`);
  },

  block(userId: string) {
    return api.post(`/api/v1/users/${userId}/block`);
  },

  unblock(userId: string) {
    return api.post(`/api/v1/users/${userId}/unblock`);
  },

  revokeSessions(userId: string) {
    return api.post(`/api/v1/users/${userId}/revoke-sessions`);
  },
};
