import { accountsApi } from "@/api/accounts";
import { usersApi } from "@/api/users";

export interface DashboardStats {
  totalUsers: number;
  totalAccounts: number;
}

export async function loadDashboardStats(): Promise<DashboardStats> {
  const [usersResponse, accountsResponse] = await Promise.all([
    usersApi.getAll({ page: 0, size: 1, sortBy: "id", sortDir: "ASC" }),
    accountsApi.getAll({ page: 0, size: 1, sortBy: "id", sortDir: "ASC" }),
  ]);

  return {
    totalUsers: usersResponse.data.totalElements,
    totalAccounts: accountsResponse.data.totalElements,
  };
}
