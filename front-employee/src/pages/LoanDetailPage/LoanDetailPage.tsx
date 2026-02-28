import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { loansApi } from "@/api/loans";
import type { LoanResponse, LoanStatus } from "@/types";
import { toast } from "sonner";
import axios from "axios";
import { localizeError } from "@/lib/error-messages";
import { ArrowLeft, Check, X } from "lucide-react";

const STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING: "Ожидает одобрения",
  ACTIVE: "Активен",
  PAID: "Погашен",
  OVERDUE: "Просрочен",
  REJECTED: "Отклонён",
};

const STATUS_VARIANT: Record<
  LoanStatus,
  "secondary" | "outline" | "destructive" | "default"
> = {
  PENDING: "outline",
  ACTIVE: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
  REJECTED: "destructive",
};

export default function LoanDetailPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<LoanResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loanId) return;
    setLoading(true);
    loansApi
      .getById(loanId)
      .then(({ data }) => setLoan(data))
      .catch(() => toast.error("Ошибка загрузки кредита"))
      .finally(() => setLoading(false));
  }, [loanId]);

  async function handleApprove() {
    if (!loan) return;
    try {
      await loansApi.approve(loan.id);
      toast.success("Кредит одобрен");
      const { data } = await loansApi.getById(loan.id);
      setLoan(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(localizeError(err.response?.data?.message));
      }
    }
  }

  async function handleReject() {
    if (!loan) return;
    if (!window.confirm("Отклонить заявку на кредит?")) return;
    try {
      await loansApi.reject(loan.id);
      toast.success("Кредит отклонён");
      const { data } = await loansApi.getById(loan.id);
      setLoan(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(localizeError(err.response?.data?.message));
      }
    }
  }

  function formatMoney(val: number) {
    return Number(val).toLocaleString("ru-RU", {
      style: "currency",
      currency: "RUB",
    });
  }

  function formatDate(val: string | null) {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("ru-RU");
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full max-w-2xl" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Кредит не найден</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Кредит: {loan.tariff?.name ?? "—"}
        </h1>
        <Badge variant={STATUS_VARIANT[loan.status]}>
          {STATUS_LABELS[loan.status] ?? loan.status}
        </Badge>
      </div>

      {loan.status === "PENDING" && (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleApprove}>
            <Check /> Одобрить
          </Button>
          <Button variant="destructive" size="sm" onClick={handleReject}>
            <X /> Отклонить
          </Button>
        </div>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Информация о кредите</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[180px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono text-xs">{loan.id}</span>

            <span className="text-muted-foreground">Заёмщик</span>
            <Link
              to={`/users/${loan.userId}`}
              className="text-primary hover:underline font-mono text-xs"
            >
              {loan.userId}
            </Link>

            <span className="text-muted-foreground">Счёт</span>
            <Link
              to={`/accounts/${loan.accountId}`}
              className="text-primary hover:underline font-mono text-xs"
            >
              {loan.accountId}
            </Link>

            <span className="text-muted-foreground">Сумма кредита</span>
            <span className="font-semibold">{formatMoney(loan.amount)}</span>

            <span className="text-muted-foreground">Остаток</span>
            <span className="font-semibold">
              {formatMoney(loan.remainingAmount)}
            </span>

            <span className="text-muted-foreground">Ежемесячный платёж</span>
            <span>{formatMoney(loan.monthlyPayment)}</span>

            <span className="text-muted-foreground">Срок</span>
            <span>{loan.termMonths} мес.</span>

            <span className="text-muted-foreground">Тип платежа</span>
            <span>
              {loan.paymentType === "ANNUITY"
                ? "Аннуитетный"
                : loan.paymentType}
            </span>

            <span className="text-muted-foreground">Следующий платёж</span>
            <span>{formatDate(loan.nextPaymentDate)}</span>

            <span className="text-muted-foreground">Дата погашения</span>
            <span>{formatDate(loan.paymentDate)}</span>

            <span className="text-muted-foreground">Дата создания</span>
            <span>{formatDate(loan.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Тариф</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[180px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Название</span>
            <span>{loan.tariff?.name ?? "—"}</span>

            <span className="text-muted-foreground">Ставка</span>
            <span>
              {loan.tariff ? `${(loan.tariff.rate * 100).toFixed(0)}%` : "—"}
            </span>

            <span className="text-muted-foreground">Диапазон сумм</span>
            <span>
              {loan.tariff
                ? `${formatMoney(loan.tariff.minAmount)} – ${formatMoney(loan.tariff.maxAmount)}`
                : "—"}
            </span>

            <span className="text-muted-foreground">Диапазон сроков</span>
            <span>
              {loan.tariff
                ? `${loan.tariff.minTermMonths} – ${loan.tariff.maxTermMonths} мес.`
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
