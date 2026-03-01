import { useEffect, useMemo, useState, type FormEvent, type UIEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../auth/api";
import { useAuth } from "../../auth/AuthContext";
import { bankingApi } from "../../banking/api";
import type { AccountDTO, AccountTransactionDTO, LoanResponse, TariffResponse } from "../../banking/types";
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
  const [loans, setLoans] = useState<LoanResponse[]>([]);
  const [tariffs, setTariffs] = useState<TariffResponse[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("100");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanTermMonths, setLoanTermMonths] = useState("");
  const [loanTariffId, setLoanTariffId] = useState("");
  const [isTariffPickerOpen, setIsTariffPickerOpen] = useState(false);
  const [tariffPage, setTariffPage] = useState(0);
  const [hasMoreTariffs, setHasMoreTariffs] = useState(true);
  const [isTariffsLoading, setIsTariffsLoading] = useState(false);
  const [loanAccountId, setLoanAccountId] = useState("");
  const [repayLoanId, setRepayLoanId] = useState("");
  const [isLoanPickerOpen, setIsLoanPickerOpen] = useState(false);
  const [loanPage, setLoanPage] = useState(0);
  const [hasMoreLoans, setHasMoreLoans] = useState(true);
  const [isLoansLoading, setIsLoansLoading] = useState(false);
  const [repayAccountId, setRepayAccountId] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  const activeLoans = useMemo(
    () => loans.filter((loan) => loan.status === "ACTIVE"),
    [loans]
  );

  const openAccounts = useMemo(() => accounts.filter((account) => account.status === "OPEN"), [accounts]);
  const selectedTariff = useMemo(
    () => tariffs.find((tariff) => tariff.id === loanTariffId) ?? null,
    [tariffs, loanTariffId]
  );
  const selectedRepayLoan = useMemo(
    () => activeLoans.find((loan) => loan.id === repayLoanId) ?? null,
    [activeLoans, repayLoanId]
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
    const loadedOpenAccounts = loadedAccounts.filter((account) => account.status === "OPEN");

    if (loadedAccounts.length === 0) {
      setSelectedAccountId("");
      setLoanAccountId("");
      setRepayAccountId("");
      return;
    }

    if (!loadedAccounts.some((account) => account.id === selectedAccountId)) {
      setSelectedAccountId(loadedAccounts[0].id);
    }

    if (!loadedOpenAccounts.some((account) => account.id === loanAccountId)) {
      setLoanAccountId(loadedOpenAccounts[0]?.id ?? "");
    }

    if (!loadedOpenAccounts.some((account) => account.id === repayAccountId)) {
      setRepayAccountId(loadedOpenAccounts[0]?.id ?? "");
    }
  };

  const loadTransactions = async (accountId: string) => {
    const page = await bankingApi.getTransactions(accountId, { size: 20, sortBy: "createdAt", sortDir: "DESC" });
    setTransactions(page.content);
  };

  const loadLoansPage = async (pageIndex: number, append: boolean) => {
    setIsLoansLoading(true);
    try {
      const page = await bankingApi.getMyLoans({ page: pageIndex, size: 20, sortBy: "createdAt", sortDir: "DESC" });
      const loadedLoans = append ? [...loans, ...page.content] : page.content;
      setLoans(loadedLoans);
      setLoanPage(page.number);
      setHasMoreLoans(page.number + 1 < page.totalPages);

      const activeLoadedLoans = loadedLoans.filter((loan) => loan.status === "ACTIVE");
      if (!activeLoadedLoans.some((loan) => loan.id === repayLoanId)) {
        setRepayLoanId(activeLoadedLoans[0]?.id ?? "");
      }
    } finally {
      setIsLoansLoading(false);
    }
  };

  const loadInitialLoans = async () => {
    await loadLoansPage(0, false);
  };

  const loadMoreLoans = async () => {
    if (isLoansLoading || !hasMoreLoans) {
      return;
    }
    try {
      await loadLoansPage(loanPage + 1, true);
    } catch {
      setError("Не удалось подгрузить дополнительные кредиты.");
      setIsLoansLoading(false);
    }
  };

  const loadTariffsPage = async (pageIndex: number, append: boolean) => {
    setIsTariffsLoading(true);
    try {
      const page = await bankingApi.getTariffs({ page: pageIndex, size: 20, sortBy: "name", sortDir: "ASC" });

      setTariffs((prev) => (append ? [...prev, ...page.content] : page.content));
      setTariffPage(page.number);
      setHasMoreTariffs(page.number + 1 < page.totalPages);

      if (!loanTariffId && page.content.length > 0) {
        setLoanTariffId(page.content[0].id);
      }
    } finally {
      setIsTariffsLoading(false);
    }
  };

  const loadInitialTariffs = async () => {
    await loadTariffsPage(0, false);
  };

  const loadMoreTariffs = async () => {
    if (isTariffsLoading || !hasMoreTariffs) {
      return;
    }
    try {
      await loadTariffsPage(tariffPage + 1, true);
    } catch {
      setError("Не удалось подгрузить дополнительные тарифы.");
      setIsTariffsLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!user?.id) {
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        await Promise.all([loadAccounts(user.id), loadInitialLoans(), loadInitialTariffs()]);
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
      setLoanAccountId(account.id);
      setRepayAccountId(account.id);
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

  const handleCreateLoan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) {
      return;
    }

    const amount = parsePositiveNumber(loanAmount);
    const termMonths = Number(loanTermMonths);

    if (!loanAccountId || !loanTariffId || !amount || !Number.isInteger(termMonths) || termMonths <= 0) {
      setError("Заполните корректно поля кредита: счет, тариф, сумма, срок.");
      return;
    }

    clearMessages();
    setIsSubmitting(true);
    try {
      await bankingApi.createLoan({
        userId: user.id,
        accountId: loanAccountId,
        amount,
        termMonths,
        tariffId: loanTariffId,
        paymentType: "ANNUITY",
      });
      setLoanAmount("");
      setLoanTermMonths("");
      setSuccess("Заявка на кредит создана.");
      await loadInitialLoans();
    } catch (err) {
      showError(err, "Не удалось оформить кредит.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTariffDropdownScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceToBottom < 32 && hasMoreTariffs && !isTariffsLoading) {
      void loadMoreTariffs();
    }
  };

  const handleLoanDropdownScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceToBottom < 32 && hasMoreLoans && !isLoansLoading) {
      void loadMoreLoans();
    }
  };

  const handleRepayLoan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) {
      return;
    }

    const amount = parsePositiveNumber(repayAmount);
    if (!repayLoanId || !repayAccountId || !amount) {
      setError("Заполните корректно поля погашения кредита.");
      return;
    }

    clearMessages();
    setIsSubmitting(true);
    try {
      await bankingApi.repayLoan(repayLoanId, {
        userId: user.id,
        accountId: repayAccountId,
        amount,
      });
      setRepayAmount("");
      setSuccess("Погашение кредита успешно выполнено.");
      await Promise.all([loadInitialLoans(), loadAccounts(user.id)]);
      if (selectedAccountId) {
        await loadTransactions(selectedAccountId);
      }
    } catch (err) {
      showError(err, "Не удалось погасить кредит.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="main-page">
      <h1 className="main-page-title">Клиентский кабинет</h1>
      <p className="main-page-subtitle">Счета, операции и кредиты</p>

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

      <div className="grid-two">
        <article className="card">
          <h2 className="card-title">Взять кредит</h2>
          <form className="stack" onSubmit={handleCreateLoan}>
            <select
              className="field"
              value={loanAccountId}
              onChange={(event) => setLoanAccountId(event.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Выберите счет для зачисления</option>
              {openAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {(account.name || "Без названия")} - {formatMoney(account.balance)}
                </option>
              ))}
            </select>

            <div className="tariff-select">
              <button
                type="button"
                className="field tariff-trigger"
                onClick={() => setIsTariffPickerOpen((value) => !value)}
                disabled={isSubmitting}
              >
                {selectedTariff ? `${selectedTariff.name} (${selectedTariff.rate}%)` : "Выберите тариф"}
              </button>
              {isTariffPickerOpen && (
                <div className="tariff-dropdown" onScroll={handleTariffDropdownScroll}>
                  {tariffs.map((tariff) => (
                    <button
                      key={tariff.id}
                      type="button"
                      className={`tariff-option${loanTariffId === tariff.id ? " tariff-option-active" : ""}`}
                      onClick={() => {
                        setLoanTariffId(tariff.id);
                        setIsTariffPickerOpen(false);
                      }}
                    >
                      <span>{tariff.name}</span>
                      <span className="tariff-option-meta">
                        {tariff.rate}% / {formatMoney(tariff.minAmount)} - {formatMoney(tariff.maxAmount)}
                      </span>
                    </button>
                  ))}
                  {isTariffsLoading && <p className="tariff-dropdown-state">Загрузка тарифов...</p>}
                  {!isTariffsLoading && !hasMoreTariffs && tariffs.length > 0 && (
                    <p className="tariff-dropdown-state">Все активные тарифы загружены</p>
                  )}
                  {!isTariffsLoading && tariffs.length === 0 && (
                    <p className="tariff-dropdown-state">Активных тарифов не найдено</p>
                  )}
                </div>
              )}
            </div>

            <input
              className="field"
              value={loanAmount}
              onChange={(event) => setLoanAmount(event.target.value)}
              placeholder="Сумма кредита"
              disabled={isSubmitting}
            />

            <input
              className="field"
              value={loanTermMonths}
              onChange={(event) => setLoanTermMonths(event.target.value)}
              placeholder="Срок в месяцах"
              disabled={isSubmitting}
            />

            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              Оформить кредит
            </button>
          </form>
        </article>

        <article className="card">
          <h2 className="card-title">Погасить кредит</h2>
          <form className="stack" onSubmit={handleRepayLoan}>
            <div className="loan-select">
              <button
                type="button"
                className="field loan-trigger"
                onClick={() => setIsLoanPickerOpen((value) => !value)}
                disabled={isSubmitting}
              >
                {selectedRepayLoan
                  ? `${selectedRepayLoan.id.slice(0, 8)}... / Остаток: ${formatMoney(selectedRepayLoan.remainingAmount)}`
                  : "Выберите активный кредит"}
              </button>
              {isLoanPickerOpen && (
                <div className="loan-dropdown" onScroll={handleLoanDropdownScroll}>
                  {activeLoans.map((loan) => (
                    <button
                      key={loan.id}
                      type="button"
                      className={`loan-option${repayLoanId === loan.id ? " loan-option-active" : ""}`}
                      onClick={() => {
                        setRepayLoanId(loan.id);
                        setIsLoanPickerOpen(false);
                      }}
                    >
                      <span>{loan.id.slice(0, 8)}...</span>
                      <span className="loan-option-meta">
                        Остаток: {formatMoney(loan.remainingAmount)} / Платеж: {formatMoney(loan.monthlyPayment)}
                      </span>
                    </button>
                  ))}
                  {isLoansLoading && <p className="loan-dropdown-state">Загрузка кредитов...</p>}
                  {!isLoansLoading && !hasMoreLoans && activeLoans.length > 0 && (
                    <p className="loan-dropdown-state">Все кредиты загружены</p>
                  )}
                  {!isLoansLoading && activeLoans.length === 0 && (
                    <p className="loan-dropdown-state">Активных кредитов не найдено</p>
                  )}
                </div>
              )}
            </div>

            <select
              className="field"
              value={repayAccountId}
              onChange={(event) => setRepayAccountId(event.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Счет списания</option>
              {openAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {(account.name || "Без названия")} - {formatMoney(account.balance)}
                </option>
              ))}
            </select>

            <input
              className="field"
              value={repayAmount}
              onChange={(event) => setRepayAmount(event.target.value)}
              placeholder="Сумма погашения"
              disabled={isSubmitting}
            />

            <button className="button button-secondary" type="submit" disabled={isSubmitting}>
              Погасить
            </button>
          </form>
        </article>
      </div>

      <article className="card">
        <h2 className="card-title">Мои кредиты</h2>
        {loans.length === 0 ? (
          <p className="muted">Кредитов пока нет.</p>
        ) : (
          <div className="loan-table-wrap">
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Статус</th>
                  <th>Сумма</th>
                  <th>Остаток</th>
                  <th>Ежемесячный платеж</th>
                  <th>Следующий платеж</th>
                  <th>Тариф</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.status}</td>
                    <td>{formatMoney(loan.amount)}</td>
                    <td>{formatMoney(loan.remainingAmount)}</td>
                    <td>{formatMoney(loan.monthlyPayment)}</td>
                    <td>{formatDate(loan.nextPaymentDate)}</td>
                    <td>{loan.tariff?.name ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
};
