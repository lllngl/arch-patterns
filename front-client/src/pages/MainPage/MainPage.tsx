import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../auth/api";
import { useAuth } from "../../auth/AuthContext";
import { bankingApi } from "../../banking/api";
import type { AccountDTO, AccountTransactionDTO } from "../../banking/types";
import "./MainPage.css";

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

function parsePositiveNumber(raw: string): number | null {
  const parsed = Number(raw.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export const MainPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [transactions, setTransactions] = useState<AccountTransactionDTO[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("100");
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  const showError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      setError(err.message || fallback);
    } else {
      setError(fallback);
    }
  };

  const loadAccounts = async (userId: string) => {
    const page = await bankingApi.getUserAccounts(userId);
    const loadedAccounts = page.content;
    setAccounts(loadedAccounts);

    if (loadedAccounts.length === 0) {
      setSelectedAccountId("");
      return;
    }

    if (!loadedAccounts.some((account) => account.id === selectedAccountId)) {
      setSelectedAccountId(loadedAccounts[0].id);
    }
  };

  const loadTransactions = async (accountId: string) => {
    const page = await bankingApi.getTransactions(accountId, { size: 20, sortBy: "createdAt", sortDir: "DESC" });
    setTransactions(page.content);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!user?.id) {
        return;
      }

      setError(null);
      setIsLoading(true);
      try {
        await loadAccounts(user.id);
      } catch (err) {
        showError(err, "Не удалось загрузить банковские данные.");
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      if (!selectedAccountId) {
        setTransactions([]);
        return;
      }

      try {
        await loadTransactions(selectedAccountId);
      } catch (err) {
        showError(err, "Не удалось загрузить историю операций.");
      }
    };

    void load();
  }, [selectedAccountId]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) {
      return;
    }

    clearMessages();
    setIsSubmitting(true);
    try {
      const name = newAccountName.trim() || "Мой счет";
      const account = await bankingApi.createAccount(user.id, name);
      setNewAccountName("");
      setSuccess("Счет успешно открыт.");
      await loadAccounts(user.id);
      setSelectedAccountId(account.id);
    } catch (err) {
      showError(err, "Не удалось открыть счет.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAccount = async (accountId: string) => {
    if (!user?.id) {
      return;
    }

    clearMessages();
    setIsSubmitting(true);
    try {
      await bankingApi.closeAccount(accountId);
      setSuccess("Счет закрыт.");
      await loadAccounts(user.id);
    } catch (err) {
      showError(err, "Не удалось закрыть счет. Возможно, на нем есть баланс.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoneyOperation = async (kind: "deposit" | "withdraw") => {
    if (!user?.id || !selectedAccountId) {
      return;
    }

    const amount = parsePositiveNumber(moneyAmount);
    if (!amount) {
      setError("Введите корректную сумму операции.");
      return;
    }

    clearMessages();
    setIsSubmitting(true);
    try {
      if (kind === "deposit") {
        await bankingApi.deposit(selectedAccountId, amount);
        setSuccess("Деньги успешно зачислены.");
      } else {
        await bankingApi.withdraw(selectedAccountId, amount);
        setSuccess("Деньги успешно сняты.");
      }
      await Promise.all([loadAccounts(user.id), loadTransactions(selectedAccountId)]);
    } catch (err) {
      showError(err, "Не удалось выполнить операцию по счету.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="main-page">
      <h1 className="main-page-title">Клиентский кабинет</h1>
      <p className="main-page-subtitle">Счета и операции</p>

      {isLoading && <div className="banner banner-info">Загрузка данных...</div>}
      {error && <div className="banner banner-error">{error}</div>}
      {success && <div className="banner banner-success">{success}</div>}

      <div className="grid-two">
        <article className="card">
          <h2 className="card-title">Открыть новый счет</h2>
          <form className="inline-form" onSubmit={handleCreateAccount}>
            <input
              className="field"
              placeholder="Название счета (опционально)"
              value={newAccountName}
              onChange={(event) => setNewAccountName(event.target.value)}
              disabled={isSubmitting}
            />
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              Открыть счет
            </button>
          </form>
        </article>

        <article className="card">
          <h2 className="card-title">Текущий счет</h2>
          {!selectedAccount ? (
            <p className="muted">Счета пока отсутствуют.</p>
          ) : (
            <div className="stack">
              <div className="current-account-card">
                <p className="current-account-name">{selectedAccount.name || "Без названия"}</p>
                <p className="current-account-balance">{formatMoney(selectedAccount.balance)}</p>
                <span className={`badge ${selectedAccount.status === "OPEN" ? "badge-open" : "badge-closed"}`}>
                  {selectedAccount.status}
                </span>
              </div>

              <div className="account-actions-row">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setIsAccountPickerOpen((value) => !value)}
                >
                  {isAccountPickerOpen ? "Скрыть выбор счета" : "Выбрать другой счет"}
                </button>
                {selectedAccount.status === "OPEN" && (
                  <button
                    className="button button-danger"
                    type="button"
                    onClick={() => void handleCloseAccount(selectedAccount.id)}
                    disabled={isSubmitting}
                  >
                    Закрыть текущий счет
                  </button>
                )}
              </div>

              {isAccountPickerOpen && (
                <div className="account-picker-panel">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      className={`account-picker-item${account.id === selectedAccountId ? " account-picker-item-active" : ""}`}
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setIsAccountPickerOpen(false);
                      }}
                    >
                      <span className="account-name">{account.name || "Без названия"}</span>
                      <span className="account-balance">{formatMoney(account.balance)}</span>
                      <span className={`badge ${account.status === "OPEN" ? "badge-open" : "badge-closed"}`}>
                        {account.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </article>
      </div>

      <div className="grid-two">
        <article className="card">
          <h2 className="card-title">Операции по счету</h2>
          {!selectedAccount ? (
            <p className="muted">Выберите счет, чтобы выполнять операции.</p>
          ) : (
            <div className="stack">
              <div className="selected-account">
                <strong>{selectedAccount.name || "Без названия"}</strong>
                <span>{formatMoney(selectedAccount.balance)}</span>
              </div>
              <div className="inline-form">
                <input
                  className="field"
                  value={moneyAmount}
                  onChange={(event) => setMoneyAmount(event.target.value)}
                  placeholder="Сумма"
                  disabled={isSubmitting || selectedAccount.status !== "OPEN"}
                />
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => void handleMoneyOperation("deposit")}
                  disabled={isSubmitting || selectedAccount.status !== "OPEN"}
                >
                  Внести
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => void handleMoneyOperation("withdraw")}
                  disabled={isSubmitting || selectedAccount.status !== "OPEN"}
                >
                  Снять
                </button>
              </div>
              {selectedAccount.status !== "OPEN" && (
                <p className="muted">Для закрытого счета операции пополнения/снятия недоступны.</p>
              )}
            </div>
          )}
        </article>

        <article className="card">
          <div className="history-header">
            <h2 className="card-title">История операций</h2>
            <Link
              to={selectedAccountId ? `/history?accountId=${selectedAccountId}` : "/history"}
              className={`button button-secondary${!selectedAccountId ? " button-disabled-link" : ""}`}
            >
              Вся история
            </Link>
          </div>
          {!selectedAccountId ? (
            <p className="muted">Выберите счет для просмотра истории.</p>
          ) : transactions.length === 0 ? (
            <p className="muted">Операций пока нет.</p>
          ) : (
            <div className="transaction-list-wrap">
              <ul className="transaction-list">
                {transactions.map((transaction) => (
                  <li key={transaction.id} className="transaction-item">
                    <div>
                      <p className="transaction-type">{transaction.type}</p>
                      <p className="transaction-date">{formatDate(transaction.createdAt)}</p>
                    </div>
                    <p className={transaction.type === "INCOME" ? "amount-plus" : "amount-minus"}>
                      {transaction.type === "INCOME" ? "+" : "-"}
                      {formatMoney(transaction.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </div>
    </section>
  );
};
