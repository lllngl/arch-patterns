import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError } from "../../auth/api";
import { useAuth } from "../../auth/AuthContext";
import { bankingApi } from "../../banking/api";
import type { AccountDTO, AccountTransactionDTO } from "../../banking/types";
import "./HistoryPage.css";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(value);
}

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
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [transactions, setTransactions] = useState<AccountTransactionDTO[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(searchParams.get("accountId") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      if (!user?.id) {
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const page = await bankingApi.getUserAccounts(user.id, { size: 100, sortBy: "createdAt", sortDir: "DESC" });
        setAccounts(page.content);

        if (page.content.length === 0) {
          setSelectedAccountId("");
          return;
        }

        if (!page.content.some((account) => account.id === selectedAccountId)) {
          setSelectedAccountId(page.content[0].id);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить счета.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadAccounts();
  }, [user?.id]);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!selectedAccountId) {
        setTransactions([]);
        return;
      }

      setSearchParams({ accountId: selectedAccountId }, { replace: true });
      setError(null);
      setIsLoading(true);
      try {
        const page = await bankingApi.getTransactions(selectedAccountId, { size: 200, sortBy: "createdAt", sortDir: "DESC" });
        setTransactions(page.content);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить историю операций.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadTransactions();
  }, [selectedAccountId, setSearchParams]);

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

      <article className="history-card">
        <label htmlFor="account-select" className="history-label">
          Выберите счет
        </label>
        <select
          id="account-select"
          className="history-select"
          value={selectedAccountId}
          onChange={(event) => setSelectedAccountId(event.target.value)}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {(account.name || "Без названия")} - {formatMoney(account.balance)} ({account.status})
            </option>
          ))}
        </select>
      </article>

      {isLoading && <div className="history-banner history-info">Загрузка...</div>}
      {error && <div className="history-banner history-error">{error}</div>}

      <article className="history-card">
        {transactions.length === 0 ? (
          <p className="history-muted">Операций пока нет.</p>
        ) : (
          <ul className="history-list">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="history-item">
                <div>
                  <p className="history-type">{transaction.type}</p>
                  <p className="history-date">{formatDate(transaction.createdAt)}</p>
                  <p className="history-description">{transaction.description || "Операция по счету"}</p>
                </div>
                <p className={transaction.type === "INCOME" ? "history-amount-plus" : "history-amount-minus"}>
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {formatMoney(transaction.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
};
