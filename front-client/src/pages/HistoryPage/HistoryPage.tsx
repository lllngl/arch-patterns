import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useAccountsStore } from "../../stores/accountsStore";
import { formatMoney, isCreditLedgerType } from "../../utils/money";
import { StatusBanner } from "../../ui/StatusBanner/StatusBanner";
import "../../ui/StatusBanner/StatusBanner.css";
import "./HistoryPage.css";

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export const HistoryPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const accounts = useAccountsStore((s) => s.accounts);
  const transactions = useAccountsStore((s) => s.transactions);
  const selectedAccountId = useAccountsStore((s) => s.selectedAccountId);
  const selectAccount = useAccountsStore((s) => s.selectAccount);
  const loadAccounts = useAccountsStore((s) => s.loadAccounts);
  const loadTransactions = useAccountsStore((s) => s.loadTransactions);
  const subscribeTransactionsChannel = useAccountsStore((s) => s.subscribeTransactionsChannel);
  const unsubscribeTransactionsChannel = useAccountsStore((s) => s.unsubscribeTransactionsChannel);
  const isLoading = useAccountsStore((s) => s.isLoading);
  const lastError = useAccountsStore((s) => s.lastError);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    void loadAccounts(user.id);
  }, [user?.id, loadAccounts]);

  useEffect(() => {
    if (accounts.length === 0) {
      return;
    }
    const fromUrl = searchParams.get("accountId");
    if (fromUrl && accounts.some((a) => a.id === fromUrl) && fromUrl !== selectedAccountId) {
      selectAccount(fromUrl);
      return;
    }
    if (!fromUrl && selectedAccountId !== accounts[0].id) {
      selectAccount(accounts[0].id);
      setSearchParams({ accountId: accounts[0].id }, { replace: true });
    }
  }, [accounts, searchParams, selectedAccountId, selectAccount, setSearchParams]);

  useEffect(() => {
    if (!selectedAccountId) {
      return;
    }
    void loadTransactions(selectedAccountId);
  }, [selectedAccountId, loadTransactions]);

  useEffect(() => {
    if (!selectedAccountId) {
      return;
    }
    subscribeTransactionsChannel(selectedAccountId);
    return () => {
      unsubscribeTransactionsChannel();
    };
  }, [selectedAccountId, subscribeTransactionsChannel, unsubscribeTransactionsChannel]);

  return (
    <section className="history-page">
      <div className="history-page-header">
        <div>
          <h1 className="history-page-title">История операций по счету</h1>
          <p className="history-page-subtitle">Полный список транзакций по выбранному счету</p>
        </div>
        <Link to="/" className="history-back-link">
          На главную
        </Link>
      </div>

      {isLoading && <StatusBanner tone="info" message="Загрузка..." />}
      {lastError && <StatusBanner tone="error" message={lastError} />}

      <article className="history-card">
        <label htmlFor="account-select" className="history-label">
          Выберите счет
        </label>
        <select
          id="account-select"
          className="history-select"
          value={selectedAccountId}
          onChange={(event) => {
            const value = event.target.value;
            selectAccount(value);
            setSearchParams({ accountId: value }, { replace: true });
          }}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {(account.name || "Без названия")} — {formatMoney(account.balance, account.currency)}
            </option>
          ))}
        </select>

        {!selectedAccountId ? (
          <p className="history-muted">Нет счетов для отображения.</p>
        ) : transactions.length === 0 ? (
          <p className="history-muted">Операций пока нет.</p>
        ) : (
          <ul className="history-list">
            {transactions.map((transaction) => {
              const cur = transaction.accountCurrency ?? transaction.operationCurrency ?? "RUB";
              const credit = isCreditLedgerType(transaction.type);
              return (
                <li key={transaction.id} className="history-item">
                  <div>
                    <p className="history-type">{transaction.type}</p>
                    <p className="history-date">{formatDate(transaction.createdAt)}</p>
                  </div>
                  <p className={credit ? "history-amount-plus" : "history-amount-minus"}>
                    {credit ? "+" : "-"}
                    {formatMoney(transaction.amount, cur)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </section>
  );
};
