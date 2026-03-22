import { Badge } from "@/components/ui/badge";
import type { LiveConnectionState } from "@/network/ws/account-transactions";

const CONNECTION_META: Record<
  LiveConnectionState,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  idle: {
    label: "WS отключён",
    variant: "outline",
  },
  connecting: {
    label: "WS подключается",
    variant: "outline",
  },
  connected: {
    label: "WS активен",
    variant: "secondary",
  },
  disabled: {
    label: "REST only",
    variant: "outline",
  },
  error: {
    label: "WS ошибка",
    variant: "destructive",
  },
};

export function LiveConnectionBadge({
  state,
}: {
  state: LiveConnectionState;
}) {
  const meta = CONNECTION_META[state];

  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
