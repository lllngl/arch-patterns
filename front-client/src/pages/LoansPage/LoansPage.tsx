import { useEffect, useMemo, useState, type FormEvent, type UIEvent } from "react";
import { ApiError } from "../../auth/api";
import { useAuth } from "../../auth/AuthContext";
import { bankingApi } from "../../banking/api";
import type { AccountDTO, LoanResponse, LoanStatus, Page, TariffResponse } from "../../banking/types";
import "./LoansPage.css";

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

const LOAN_STATUS_OPTIONS: Array<{ value: "" | LoanStatus; label: string }> = [
  { value: "", label: "Все статусы" },
  { value: "PENDING", label: "PENDING" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "PAID", label: "PAID" },
  { value: "OVERDUE", label: "OVERDUE" },
  { value: "REJECTED", label: "REJECTED" },
];

export const LoansPage = () => {
  const { user } = useAuth();
  const [openAccounts, setOpenAccounts] = useState<AccountDTO[]>([]);
  const [tariffs, setTariffs] = useState<TariffResponse[]>([]);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanTermMonths, setLoanTermMonths] = useState("");
  const [loanTariffId, setLoanTariffId] = useState("");
  const [loanAccountId, setLoanAccountId] = useState("");
  const [isTariffPickerOpen, setIsTariffPickerOpen] = useState(false);
  const [tariffPage, setTariffPage] = useState(0);
  const [hasMoreTariffs, setHasMoreTariffs] = useState(true);
  const [isTariffsLoading, setIsTariffsLoading] = useState(false);

  const [activeLoanOptions, setActiveLoanOptions] = useState<LoanResponse[]>([]);
  const [activeLoanPage, setActiveLoanPage] = useState(0);
  const [hasMoreActiveLoans, setHasMoreActiveLoans] = useState(true);
  const [isActiveLoansLoading, setIsActiveLoansLoading] = useState(false);
  const [isLoanPickerOpen, setIsLoanPickerOpen] = useState(false);
  const [repayLoanId, setRepayLoanId] = useState("");
  const [repayAccountId, setRepayAccountId] = useState("");
  const [repayAmount, setRepayAmount] = useState("");

  const [loanStatusFilter, setLoanStatusFilter] = useState<"" | LoanStatus>("");
  const [loanPage, setLoanPage] = useState(0);
  const [loanListPage, setLoanListPage] = useState<Page<LoanResponse> | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedTariff = useMemo(
    () => tariffs.find((tariff) => tariff.id === loanTariffId) ?? null,
    [tariffs, loanTariffId]
  );
  const selectedRepayLoan = useMemo(
    () => activeLoanOptions.find((loan) => loan.id === repayLoanId) ?? null,
    [activeLoanOptions, repayLoanId]
  );

  const statusBadgeClass = (status: LoanStatus) => {
    switch (status) {
      case "ACTIVE":
        return "loan-status-badge loan-status-active";
      case "PAID":
        return "loan-status-badge loan-status-paid";
      case "PENDING":
        return "loan-status-badge loan-status-pending";
      case "OVERDUE":
        return "loan-status-badge loan-status-overdue";
      case "REJECTED":
        return "loan-status-badge loan-status-rejected";
      default:
        return "loan-status-badge";
    }
  };

  const showError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      setError(err.message || fallback);
    } else {
      setError(fallback);
    }
  };

  const loadOpenAccounts = async (userId: string) => {
    const page = await bankingApi.getUserAccounts(userId, { size: 100, sortBy: "createdAt", sortDir: "DESC" });
    const accounts = page.content.filter((account) => account.status === "OPEN");
    setOpenAccounts(accounts);

    if (!accounts.some((account) => account.id === loanAccountId)) {
      setLoanAccountId(accounts[0]?.id ?? "");
    }
    if (!accounts.some((account) => account.id === repayAccountId)) {
      setRepayAccountId(accounts[0]?.id ?? "");
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

  const loadActiveLoansPage = async (pageIndex: number, append: boolean) => {
    setIsActiveLoansLoading(true);
    try {
      const page = await bankingApi.getMyLoans(
        { page: pageIndex, size: 20, sortBy: "createdAt", sortDir: "DESC" },
        "ACTIVE"
      );
      setActiveLoanOptions((prev) => (append ? [...prev, ...page.content] : page.content));
      setActiveLoanPage(page.number);
      setHasMoreActiveLoans(page.number + 1 < page.totalPages);

      if (!page.content.some((loan) => loan.id === repayLoanId) && page.content.length > 0 && !append) {
        setRepayLoanId(page.content[0].id);
      }
    } finally {
      setIsActiveLoansLoading(false);
    }
  };

  const loadLoanTablePage = async (pageIndex: number, status: "" | LoanStatus) => {
    const page = await bankingApi.getMyLoans(
      { page: pageIndex, size: 10, sortBy: "createdAt", sortDir: "DESC" },
      status || undefined
    );
    setLoanListPage(page);
    setLoanPage(page.number);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!user?.id) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([loadOpenAccounts(user.id), loadTariffsPage(0, false), loadActiveLoansPage(0, false), loadLoanTablePage(0, "")]);
      } catch (err) {
        showError(err, "Не удалось загрузить данные по кредитам.");
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [user?.id]);

  useEffect(() => {
    const loadByFilter = async () => {
      if (!user?.id) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        await loadLoanTablePage(0, loanStatusFilter);
      } catch (err) {
        showError(err, "Не удалось применить фильтр кредитов.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadByFilter();
  }, [loanStatusFilter]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleTariffDropdownScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceToBottom < 32 && hasMoreTariffs && !isTariffsLoading) {
      void loadTariffsPage(tariffPage + 1, true);
    }
  };

  const handleActiveLoanDropdownScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceToBottom < 32 && hasMoreActiveLoans && !isActiveLoansLoading) {
      void loadActiveLoansPage(activeLoanPage + 1, true);
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
      await Promise.all([loadLoanTablePage(loanPage, loanStatusFilter), loadActiveLoansPage(0, false)]);
    } catch (err) {
      showError(err, "Не удалось оформить кредит.");
    } finally {
      setIsSubmitting(false);
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
      await Promise.all([loadLoanTablePage(loanPage, loanStatusFilter), loadActiveLoansPage(0, false), loadOpenAccounts(user.id)]);
    } catch (err) {
      showError(err, "Не удалось погасить кредит.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeLoanPage = async (nextPage: number) => {
    if (nextPage < 0 || !loanListPage || nextPage >= loanListPage.totalPages) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await loadLoanTablePage(nextPage, loanStatusFilter);
    } catch (err) {
      showError(err, "Не удалось переключить страницу кредитов.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="loans-page">
      <h1 className="loans-page-title">Кредиты</h1>
      <p className="loans-page-subtitle">Оформление, погашение и список кредитов</p>

      {isLoading && <div className="loans-banner loans-banner-info">Загрузка данных...</div>}
      {error && <div className="loans-banner loans-banner-error">{error}</div>}
      {success && <div className="loans-banner loans-banner-success">{success}</div>}

      <div className="loans-grid">
        <article className="loans-card">
          <h2 className="loans-card-title">Взять кредит</h2>
          <form className="loans-stack" onSubmit={handleCreateLoan}>
            <select
              className="loans-field"
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

            <div className="loans-select">
              <button
                type="button"
                className="loans-field loans-select-trigger"
                onClick={() => setIsTariffPickerOpen((value) => !value)}
                disabled={isSubmitting}
              >
                {selectedTariff ? `${selectedTariff.name} (${selectedTariff.rate}%)` : "Выберите тариф"}
              </button>
              {isTariffPickerOpen && (
                <div className="loans-dropdown" onScroll={handleTariffDropdownScroll}>
                  {tariffs.map((tariff) => (
                    <button
                      key={tariff.id}
                      type="button"
                      className={`loans-option${loanTariffId === tariff.id ? " loans-option-active" : ""}`}
                      onClick={() => {
                        setLoanTariffId(tariff.id);
                        setIsTariffPickerOpen(false);
                      }}
                    >
                      <span>{tariff.name}</span>
                      <span className="loans-option-meta">
                        {tariff.rate}% / {formatMoney(tariff.minAmount)} - {formatMoney(tariff.maxAmount)}
                      </span>
                    </button>
                  ))}
                  {isTariffsLoading && <p className="loans-dropdown-state">Загрузка тарифов...</p>}
                  {!isTariffsLoading && !hasMoreTariffs && tariffs.length > 0 && (
                    <p className="loans-dropdown-state">Все активные тарифы загружены</p>
                  )}
                </div>
              )}
            </div>

            <input
              className="loans-field"
              value={loanAmount}
              onChange={(event) => setLoanAmount(event.target.value)}
              placeholder="Сумма кредита"
              disabled={isSubmitting}
            />
            <input
              className="loans-field"
              value={loanTermMonths}
              onChange={(event) => setLoanTermMonths(event.target.value)}
              placeholder="Срок в месяцах"
              disabled={isSubmitting}
            />
            <button className="loans-button loans-button-primary" type="submit" disabled={isSubmitting}>
              Оформить кредит
            </button>
          </form>
        </article>

        <article className="loans-card">
          <h2 className="loans-card-title">Погасить кредит</h2>
          <form className="loans-stack" onSubmit={handleRepayLoan}>
            <div className="loans-select">
              <button
                type="button"
                className="loans-field loans-select-trigger"
                onClick={() => setIsLoanPickerOpen((value) => !value)}
                disabled={isSubmitting}
              >
                {selectedRepayLoan
                  ? `${selectedRepayLoan.id.slice(0, 8)}... / Остаток: ${formatMoney(selectedRepayLoan.remainingAmount)}`
                  : "Выберите активный кредит"}
              </button>
              {isLoanPickerOpen && (
                <div className="loans-dropdown" onScroll={handleActiveLoanDropdownScroll}>
                  {activeLoanOptions.map((loan) => (
                    <button
                      key={loan.id}
                      type="button"
                      className={`loans-option${repayLoanId === loan.id ? " loans-option-active" : ""}`}
                      onClick={() => {
                        setRepayLoanId(loan.id);
                        setIsLoanPickerOpen(false);
                      }}
                    >
                      <span>{loan.id.slice(0, 8)}...</span>
                      <span className="loans-option-meta">
                        Остаток: {formatMoney(loan.remainingAmount)} / Платеж: {formatMoney(loan.monthlyPayment)}
                      </span>
                    </button>
                  ))}
                  {isActiveLoansLoading && <p className="loans-dropdown-state">Загрузка кредитов...</p>}
                  {!isActiveLoansLoading && !hasMoreActiveLoans && activeLoanOptions.length > 0 && (
                    <p className="loans-dropdown-state">Все активные кредиты загружены</p>
                  )}
                </div>
              )}
            </div>

            <select
              className="loans-field"
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
              className="loans-field"
              value={repayAmount}
              onChange={(event) => setRepayAmount(event.target.value)}
              placeholder="Сумма погашения"
              disabled={isSubmitting}
            />
            <button className="loans-button loans-button-secondary" type="submit" disabled={isSubmitting}>
              Погасить
            </button>
          </form>
        </article>
      </div>

      <article className="loans-card">
        <div className="loans-table-header">
          <h2 className="loans-card-title">Список кредитов</h2>
          <select
            className="loans-filter-select"
            value={loanStatusFilter}
            onChange={(event) => setLoanStatusFilter(event.target.value as "" | LoanStatus)}
          >
            {LOAN_STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {!loanListPage || loanListPage.content.length === 0 ? (
          <p className="loans-muted">Кредиты не найдены.</p>
        ) : (
          <>
            <div className="loans-table-wrap">
              <table className="loans-table">
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
                  {loanListPage.content.map((loan) => (
                    <tr key={loan.id}>
                      <td>
                        <span className={statusBadgeClass(loan.status)}>{loan.status}</span>
                      </td>
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

            <div className="loans-pagination">
              <button
                type="button"
                className="loans-button loans-button-outline"
                onClick={() => void handleChangeLoanPage(loanPage - 1)}
                disabled={loanListPage.first || isLoading}
              >
                Назад
              </button>
              <span className="loans-pagination-info">
                Страница {loanPage + 1} из {loanListPage.totalPages}
              </span>
              <button
                type="button"
                className="loans-button loans-button-outline"
                onClick={() => void handleChangeLoanPage(loanPage + 1)}
                disabled={loanListPage.last || isLoading}
              >
                Вперед
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
};
