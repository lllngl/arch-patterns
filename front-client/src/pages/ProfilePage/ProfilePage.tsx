import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { creditApi } from "../../api/creditApi";
import type { CurrencyCode } from "../../contracts/banking";
import type { CreditRatingDTO, PaymentHistoryDTO } from "../../contracts/credit";
import { formatMoney } from "../../utils/money";

function asCurrency(code: string): CurrencyCode {
  return code === "USD" || code === "EUR" ? code : "RUB";
}
import { StatusBanner } from "../../ui/StatusBanner/StatusBanner";
import "../../ui/StatusBanner/StatusBanner.css";
import "./ProfilePage.css";

export const ProfilePage = () => {
  const { user } = useAuth();
  const [overdue, setOverdue] = useState<PaymentHistoryDTO[] | null>(null);
  const [rating, setRating] = useState<CreditRatingDTO | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        return;
      }
      setCreditLoading(true);
      setCreditError(null);
      try {
        const [payments, r] = await Promise.all([
          creditApi.getOverduePayments(user.id),
          creditApi.getCreditRating(),
        ]);
        setOverdue(payments);
        setRating(r);
      } catch {
        setCreditError("Не удалось загрузить кредитные данные.");
        setOverdue(null);
        setRating(null);
      } finally {
        setCreditLoading(false);
      }
    };
    void load();
  }, [user?.id]);

  return (
    <section className="profile-page">
      <h1 className="profile-page-title">Профиль клиента</h1>
      <div className="profile-grid">
        <div className="profile-item">
          <span className="profile-label">Имя</span>
          <span className="profile-value">{user?.firstName ?? "-"}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Фамилия</span>
          <span className="profile-value">{user?.lastName ?? "-"}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Email</span>
          <span className="profile-value">{user?.email ?? "-"}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Роли</span>
          <span className="profile-value">{user?.roles?.length ? user.roles.join(", ") : "-"}</span>
        </div>
      </div>

      <h2 className="profile-section-title">Кредитная информация</h2>
      {creditLoading && <StatusBanner tone="info" message="Загрузка кредитных данных..." />}
      {creditError && !creditLoading && <StatusBanner tone="error" message={creditError} />}

      {overdue && overdue.length > 0 && (
        <div className="profile-credit-block">
          <h3 className="profile-subtitle">Просроченные платежи</h3>
          <ul className="profile-overdue-list">
            {overdue.map((p) => (
              <li key={p.paymentId}>
                Кредит {p.loanId.slice(0, 8)}… — {formatMoney(p.paymentAmount, asCurrency(p.currencyCode))} — срок{" "}
                {p.expectedPaymentDate}, статус {p.status}
                {p.penaltyAmount > 0 ? `, пени ${formatMoney(p.penaltyAmount, asCurrency(p.currencyCode))}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rating && (
        <div className="profile-credit-block">
          <h3 className="profile-subtitle">Кредитный рейтинг</h3>
          <p className="profile-rating">
            <strong>{rating.score}</strong> / 1000 — {rating.grade}
          </p>
          <p className="profile-muted">
            Активных: {rating.activeLoans}, закрытых: {rating.paidLoans}, просрочек: {rating.overdueCount}
          </p>
          <p className="profile-muted">
            Новый кредит: {rating.isEligibleForNewLoan ? "доступен" : "недоступен"}
          </p>
          {rating.lastOverdueDate && (
            <p className="profile-muted">Последняя просрочка: {rating.lastOverdueDate}</p>
          )}
        </div>
      )}
    </section>
  );
};
