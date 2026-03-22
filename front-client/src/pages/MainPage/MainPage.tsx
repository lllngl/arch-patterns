import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import type { CurrencyCode } from "../../contracts/banking";
import { useAccountsStore } from "../../stores/accountsStore";
import { useAppSettingsStore } from "../../stores/appSettingsStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { formatMoney, isCreditLedgerType } from "../../utils/money";
import { StatusBanner } from "../../ui/StatusBanner/StatusBanner";
import "../../ui/StatusBanner/StatusBanner.css";
import "./MainPage.css";

const CURRENCIES: CurrencyCode[] = ["RUB", "USD", "EUR"];

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
  const accounts = useAccountsStore((s) => s.accounts);
  const selectedAccountId = useAccountsStore((s) => s.selectedAccountId);
  const selectAccount = useAccountsStore((s) => s.selectAccount);
  const transactions = useAccountsStore((s) => s.transactions);
  const isLoading = useAccountsStore((s) => s.isLoading);
  const isSubmitting = useAccountsStore((s) => s.isSubmitting);
  const lastError = useAccountsStore((s) => s.lastError);
  const loadAccounts = useAccountsStore((s) => s.loadAccounts);
  const loadTransactions = useAccountsStore((s) => s.loadTransactions);
  const subscribeTransactionsChannel = useAccountsStore((s) => s.subscribeTransactionsChannel);
  const unsubscribeTransactionsChannel = useAccountsStore((s) => s.unsubscribeTransactionsChannel);
  const createAccount = useAccountsStore((s) => s.createAccount);
  const closeAccount = useAccountsStore((s) => s.closeAccount);
  const deposit = useAccountsStore((s) => s.deposit);
  const withdraw = useAccountsStore((s) => s.withdraw);
  const transfer = useAccountsStore((s) => s.transfer);
  const clearError = useAccountsStore((s) => s.clearError);

  const hiddenAccountIds = useAppSettingsStore((s) => s.hiddenAccountIds);
  const toggleHiddenAccount = useAppSettingsStore((s) => s.toggleHiddenAccount);
  const pushToast = useNotificationStore((s) => s.pushToast);

  const [newAccountName, setNewAccountName] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("100");
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [transferToId, setTransferToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferCurrency, setTransferCurrency] = useState<CurrencyCode>("RUB");

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  useEffect(() => {
    if (selectedAccount) {
      setTransferCurrency(selectedAccount.currency);
    }
  }, [selectedAccount?.id, selectedAccount?.currency]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    void loadAccounts(user.id);
  }, [user?.id, loadAccounts]);

  useEffect(() => {
    if (!selectedAccountId) {
      return;
    }
    void loadTransactions(selectedAccountId);
    subscribeTransactionsChannel(selectedAccountId);
    return () => {
      unsubscribeTransactionsChannel();
    };
  }, [selectedAccountId, loadTransactions, subscribeTransactionsChannel, unsubscribeTransactionsChannel]);

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) {
      return;
    }
    clearError();
    const name = newAccountName.trim() || "Мой счет";
    await createAccount(user.id, name);
    setNewAccountName("");
  };

  const handleCloseAccount = async (accountId: string) => {
    if (!user?.id) {
      return;
    }
    clearError();
    await closeAccount(user.id, accountId);
  };

  const handleMoneyOperation = async (kind: "deposit" | "withdraw") => {
    if (!user?.id || !selectedAccountId || !selectedAccount) {
      return;
    }
    const amount = parsePositiveNumber(moneyAmount);
    if (!amount) {
      return;
    }
    clearError();
    const opCur = selectedAccount.currency;
    if (kind === "deposit") {
      await deposit(user.id, selectedAccountId, amount, opCur);
    } else {
      await withdraw(user.id, selectedAccountId, amount, opCur);
    }
  };

  const handleCopySelectedAccountId = async () => {
    if (!selectedAccount) {
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedAccount.id);
      pushToast("success", "UUID счёта скопирован в буфер обмена.");
    } catch {
      pushToast("error", "Не удалось скопировать. Скопируйте вручную.");
    }
  };

  const handleTransfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id || !selectedAccountId) {
      return;
    }
    const amount = parsePositiveNumber(transferAmount);
    const toId = transferToId.trim();
    if (!amount || !toId) {
      return;
    }
    clearError();
    await transfer(user.id, {
      fromAccountId: selectedAccountId,
      toAccountId: toId,
      amount,
      operationCurrency: transferCurrency,
    });
    setTransferAmount("");
  };

  return (
    <section className="main-page">
      <h1 className="main-page-title">Клиентский кабинет</h1>
      <p className="main-page-subtitle">Счета и операции</p>

      {isLoading && <StatusBanner tone="info" message="Загрузка данных..." />}
      {lastError && <StatusBanner tone="error" message={lastError} />}

      <div className="grid-two">
        <article className="card">
          <h2 className="card-title">Открыть новый счет</h2>
          <form className="inline-form" onSubmit={(e) => void handleCreateAccount(e)}>
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
                <p className="current-account-balance">{formatMoney(selectedAccount.balance, selectedAccount.currency)}</p>
                <span className={`badge ${selectedAccount.status === "OPEN" ? "badge-open" : "badge-closed"}`}>
                  {selectedAccount.status}
                </span>
                <div className="account-id-block">
                  <span className="account-id-label">ID счёта (UUID для API и переводов)</span>
                  <div className="account-id-copy-row">
                    <code className="account-id-value">{selectedAccount.id}</code>
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      onClick={() => void handleCopySelectedAccountId()}
                    >
                      Копировать
                    </button>
                  </div>
                </div>
              </div>

              <div className="account-actions-row">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setIsAccountPickerOpen((value) => !value)}
                >
                  {isAccountPickerOpen ? "Скрыть выбор счета" : "Выбрать другой счет"}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => void toggleHiddenAccount(selectedAccount.id)}
                >
                  {hiddenAccountIds.includes(selectedAccount.id) ? "Показать в списках" : "Скрыть счёт"}
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
                      title={`UUID: ${account.id}`}
                      className={`account-picker-item${account.id === selectedAccountId ? " account-picker-item-active" : ""}`}
                      onClick={() => {
                        selectAccount(account.id);
                        setIsAccountPickerOpen(false);
                      }}
                    >
                      <span className="account-name">
                        {account.name || "Без названия"}
                        {hiddenAccountIds.includes(account.id) ? " · скрыт" : ""}
                      </span>
                      <span className="account-balance">{formatMoney(account.balance, account.currency)}</span>
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
                <span>{formatMoney(selectedAccount.balance, selectedAccount.currency)}</span>
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

              <h3 className="card-subtitle">Перевод на другой счёт</h3>
              <p className="muted small-print">
                В поле ниже укажите UUID счёта-получателя. Свой UUID текущего счёта — в блоке «Текущий счёт» выше. При разных
                валютах конвертация по курсу на стороне банка.
              </p>
              <form className="stack" onSubmit={(e) => void handleTransfer(e)}>
                <div className="inline-form">
                  <input
                    className="field"
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    placeholder="Счёт получателя (id)"
                    disabled={isSubmitting || selectedAccount.status !== "OPEN"}
                  />
                  <input
                    className="field"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Сумма"
                    disabled={isSubmitting || selectedAccount.status !== "OPEN"}
                  />
                  <select
                    className="field"
                    value={transferCurrency}
                    onChange={(e) => setTransferCurrency(e.target.value as CurrencyCode)}
                    disabled={isSubmitting || selectedAccount.status !== "OPEN"}
                    aria-label="Валюта операции"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    className="button button-secondary"
                    type="submit"
                    disabled={isSubmitting || selectedAccount.status !== "OPEN"}
                  >
                    Перевести
                  </button>
                </div>
              </form>

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
                {transactions.map((transaction) => {
                  const cur = transaction.accountCurrency ?? transaction.operationCurrency ?? "RUB";
                  const credit = isCreditLedgerType(transaction.type);
                  return (
                    <li key={transaction.id} className="transaction-item">
                      <div>
                        <p className="transaction-type">{transaction.type}</p>
                        <p className="transaction-date">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <p className={credit ? "amount-plus" : "amount-minus"}>
                        {credit ? "+" : "-"}
                        {formatMoney(transaction.amount, cur)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </article>
      </div>
    </section>
  );
};
