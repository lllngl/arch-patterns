import { api } from "./client";
import type {
  TariffResponse,
  CreateTariffRequest,
  Page,
  PageRequestParams,
} from "@/types";

export interface TariffsFilterParams extends PageRequestParams {
  active?: boolean;
}

export const tariffsApi = {
  getAll(params: TariffsFilterParams = {}) {
    return api.get<Page<TariffResponse>>("/api/v1/tariffs", { params });
  },

  getById(id: string) {
    return api.get<TariffResponse>(`/api/v1/tariffs/${id}`);
  },

  create(data: CreateTariffRequest) {
    return api.post<TariffResponse>("/api/v1/tariffs", data);
  },

  activate(id: string) {
    return api.patch(`/api/v1/tariffs/${id}/activate`);
  },

  deactivate(id: string) {
    return api.patch(`/api/v1/tariffs/${id}/deactivate`);
  },
};
