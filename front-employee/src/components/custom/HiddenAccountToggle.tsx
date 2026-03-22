import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSettingsStore } from "@/stores/app-settings";

export function HiddenAccountToggle({ accountId }: { accountId: string }) {
  const isHidden = useAppSettingsStore((state) => state.isAccountHidden(accountId));
  const toggleHiddenAccount = useAppSettingsStore(
    (state) => state.toggleHiddenAccount
  );

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleHiddenAccount(accountId)}
    >
      {isHidden ? <Eye /> : <EyeOff />}
      {isHidden ? "Показать в списках" : "Скрыть в списках"}
    </Button>
  );
}
