import { useEffect, useMemo, useState, type FormEvent, type UIEvent } from "react";
import { useAuth } from "../../auth/useAuth";
import { useLoansStore } from "../../stores/loansStore";
import type { LoanStatus } from "../../contracts/banking";
import { StatusBanner } from "../../ui/StatusBanner/StatusBanner";
import "../../ui/StatusBanner/StatusBanner.css";
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
  const openAccounts = useLoansStore((s) => s.openAccounts);
  const tariffs = useLoansStore((s) => s.tariffs);
  const tariffPage = useLoansStore((s) => s.tariffPage);
  const hasMoreTariffs = useLoansStore((s) => s.hasMoreTariffs);
  const isTariffsLoading = useLoansStore((s) => s.isTariffsLoading);
  const activeLoanOptions = useLoansStore((s) => s.activeLoanOptions);
  const activeLoanPage = useLoansStore((s) => s.activeLoanPage);
  const hasMoreActiveLoans = useLoansStore((s) => s.hasMoreActiveLoans);
  const isActiveLoansLoading = useLoansStore((s) => s.isActiveLoansLoading);
  const loanListPage = useLoansStore((s) => s.loanListPage);
  const loanTablePageIndex = useLoansStore((s) => s.loanTablePageIndex);
  const loanStatusFilter = useLoansStore((s) => s.loanStatusFilter);
  const isLoading = useLoansStore((s) => s.isLoading);
  const isSubmitting = useLoansStore((s) => s.isSubmitting);
  const lastError = useLoansStore((s) => s.lastError);
  const bootstrap = useLoansStore((s) => s.bootstrap);
  const loadTariffsPage = useLoansStore((s) => s.loadTariffsPage);
  const loadActiveLoansPage = useLoansStore((s) => s.loadActiveLoansPage);
  const setLoanStatusFilter = useLoansStore((s) => s.setLoanStatusFilter);
  const changeLoanTablePage = useLoansStore((s) => s.changeLoanTablePage);
  const createLoan = useLoansStore((s) => s.createLoan);
  const repayLoan = useLoansStore((s) => s.repayLoan);
  const clearError = useLoansStore((s) => s.clearError);

  const [loanAmount, setLoanAmount] = useState("");
  const [loanTermMonths, setLoanTermMonths] = useState("");
  const [loanTariffId, setLoanTariffId] = useState("");
  const [loanAccountId, setLoanAccountId] = useState("");
  const [isTariffPickerOpen, setIsTariffPickerOpen] = useState(false);
  const [isLoanPickerOpen, setIsLoanPickerOpen] = useState(false);
  const [repayLoanId, setRepayLoanId] = useState("");
  const [repayAccountId, setRepayAccountId] = useState("");
  const [repayAmount, setRepayAmount] = useState("");

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

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    void bootstrap(user.id);
  }, [user?.id, bootstrap]);

  useEffect(() => {
    if (!openAccounts.some((a) => a.id === loanAccountId)) {
      setLoanAccountId(openAccounts[0]?.id ?? "");
    }
    if (!openAccounts.some((a) => a.id === repayAccountId)) {
      setRepayAccountId(openAccounts[0]?.id ?? "");
    }
  }, [openAccounts, loanAccountId, repayAccountId]);

  useEffect(() => {
    if (tariffs.length > 0 && !loanTariffId) {
      setLoanTariffId(tariffs[0].id);
    }
  }, [tariffs, loanTariffId]);

  useEffect(() => {
    if (activeLoanOptions.length > 0 && !activeLoanOptions.some((l) => l.id === repayLoanId)) {
      setRepayLoanId(activeLoanOptions[0].id);
    }
  }, [activeLoanOptions, repayLoanId]);

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
      return;
    }
    clearError();
    await createLoan(user.id, {
      accountId: loanAccountId,
      tariffId: loanTariffId,
      amount,
      termMonths,
    });
    setLoanAmount("");
    setLoanTermMonths("");
  };

  const handleRepayLoan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) {
      return;
    }
    const amount = parsePositiveNumber(repayAmount);
    if (!repayLoanId || !repayAccountId || !amount) {
      return;
    }
    clearError();
    await repayLoan(user.id, {
      loanId: repayLoanId,
      accountId: repayAccountId,
      amount,
    });
    setRepayAmount("");
  };

  return (
    <section className="loans-page">
      <h1 className="loans-page-title">Кредиты</h1>
      <p className="loans-page-subtitle">Оформление, погашение и список кредитов</p>

      {isLoading && <div className="loans-banner loans-banner-info">Загрузка данных...</div>}
      {lastError && <StatusBanner tone="error" message={lastError} />}

      <div className="loans-grid">
        <article className="loans-card">
          <h2 className="loans-card-title">Взять кредит</h2>
          <form className="loans-stack" onSubmit={(e) => void handleCreateLoan(e)}>
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
          <form className="loans-stack" onSubmit={(e) => void handleRepayLoan(e)}>
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
            onChange={(event) => void setLoanStatusFilter(event.target.value as "" | LoanStatus)}
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
                onClick={() => void changeLoanTablePage(loanTablePageIndex - 1)}
                disabled={loanListPage.first || isLoading}
              >
                Назад
              </button>
              <span className="loans-pagination-info">
                Страница {loanTablePageIndex + 1} из {loanListPage.totalPages}
              </span>
              <button
                type="button"
                className="loans-button loans-button-outline"
                onClick={() => void changeLoanTablePage(loanTablePageIndex + 1)}
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
