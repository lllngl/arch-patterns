import { useEffect } from "react";
import { useAccountsStore } from "../stores/accountsStore";

/**
 * Держит STOMP-подписку на инвалидацию истории/баланса по выбранному счёту
 * на всех экранах защищённой зоны (не только главная / история).
 */
export function AccountTransactionsRealtime() {
  const selectedAccountId = useAccountsStore((s) => s.selectedAccountId);
  const subscribeTransactionsChannel = useAccountsStore((s) => s.subscribeTransactionsChannel);
  const unsubscribeTransactionsChannel = useAccountsStore((s) => s.unsubscribeTransactionsChannel);

  useEffect(() => {
    if (!selectedAccountId) {
      unsubscribeTransactionsChannel();
      return;
    }
    subscribeTransactionsChannel(selectedAccountId);
    return () => {
      unsubscribeTransactionsChannel();
    };
  }, [selectedAccountId, subscribeTransactionsChannel, unsubscribeTransactionsChannel]);

  return null;
}
