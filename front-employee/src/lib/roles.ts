import type { RoleName, UserDTO } from "@/types";

export const ROLE_LABELS: Record<RoleName, string> = {
  CLIENT: "Клиент",
  EMPLOYEE: "Сотрудник",
};

export function hasRole(
  user: Pick<UserDTO, "roles"> | null | undefined,
  role: RoleName
) {
  return user?.roles?.includes(role) ?? false;
}

export function getRoleLabel(role: RoleName) {
  return ROLE_LABELS[role] ?? role;
}
