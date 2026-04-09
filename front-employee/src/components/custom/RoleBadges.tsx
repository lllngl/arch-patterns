import { Badge } from "@/components/ui/badge";
import type { RoleName } from "@/types";
import { getRoleLabel } from "@/lib/roles";

export function RoleBadges({
  roles,
  variant = "outline",
}: {
  roles: RoleName[] | null | undefined;
  variant?: "outline" | "secondary" | "default";
}) {
  if (!roles?.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <Badge key={role} variant={variant}>
          {getRoleLabel(role)}
        </Badge>
      ))}
    </div>
  );
}
