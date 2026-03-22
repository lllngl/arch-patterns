import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { creditApi } from "../../api/creditApi";
import type { CreditRatingDTO, OverduePaymentDTO } from "../../contracts/credit";
import { StatusBanner } from "../../ui/StatusBanner/StatusBanner";
import "../../ui/StatusBanner/StatusBanner.css";
import "./ProfilePage.css";

export const ProfilePage = () => {
  const { user } = useAuth();
  const [overdue, setOverdue] = useState<OverduePaymentDTO[] | null>(null);
  const [rating, setRating] = useState<CreditRatingDTO | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditMessage, setCreditMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        return;
      }
      setCreditLoading(true);
      setCreditMessage(null);
      try {
        const [o, r] = await Promise.all([creditApi.getOverduePayments(user.id), creditApi.getCreditRating(user.id)]);
        setOverdue(o);
        setRating(r);
        if (o.length === 0 && r === null) {
          setCreditMessage("Просроченных платежей нет. Сведения о кредитном рейтинге пока отсутствуют.");
        }
      } catch {
        setCreditMessage("Не удалось загрузить кредитные данные.");
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
          <span className="profile-value">
            {user?.roles?.length ? user.roles.join(", ") : "-"}
          </span>
        </div>
      </div>

      <h2 className="profile-section-title">Кредитная информация</h2>
      {creditLoading && <StatusBanner tone="info" message="Загрузка кредитных данных..." />}
      {creditMessage && !creditLoading && <StatusBanner tone="info" message={creditMessage} />}

      {overdue && overdue.length > 0 && (
        <div className="profile-credit-block">
          <h3 className="profile-subtitle">Просроченные платежи</h3>
          <ul className="profile-overdue-list">
            {overdue.map((p) => (
              <li key={`${p.loanId}-${p.dueDate}`}>
                Кредит {p.loanId.slice(0, 8)}… — {p.amount} {p.currency} до {p.dueDate}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rating && (
        <div className="profile-credit-block">
          <h3 className="profile-subtitle">Кредитный рейтинг</h3>
          <p className="profile-rating">
            <strong>{rating.score}</strong> / 100 — {rating.label}
          </p>
          <p className="profile-muted">Обновлено: {rating.computedAt}</p>
        </div>
      )}
    </section>
  );
};
