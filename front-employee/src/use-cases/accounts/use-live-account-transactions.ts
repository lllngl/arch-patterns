import { useEffect, useState } from "react";
import {
  subscribeToAccountTransactions,
  type LiveConnectionState,
} from "@/network/ws/account-transactions";

export function useLiveAccountTransactions(
  accountId: string | undefined,
  onInvalidated: () => void
) {
  const [connectionState, setConnectionState] =
    useState<LiveConnectionState>("idle");

  useEffect(() => {
    if (!accountId) {
      return;
    }

    return subscribeToAccountTransactions(accountId, {
      onInvalidated,
      onStateChange: setConnectionState,
    });
  }, [accountId, onInvalidated]);

  return accountId ? connectionState : "idle";
}
