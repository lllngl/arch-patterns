import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loansApi } from "@/api/loans";
import type {
  CreditRatingResponse,
  LoanResponse,
  LoanStatus,
  Page,
  PaymentHistoryResponse,
  PaymentStatus,
} from "@/types";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";
import { getErrorMessage } from "@/lib/http-error";

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

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: "Оплачен",
  LATE: "С опозданием",
  OVERDUE: "Просрочен",
  SKIPPED: "Пропущен",
};

export default function LoanDetailPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<LoanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditRating, setCreditRating] = useState<CreditRatingResponse | null>(
    null
  );
  const [overduePayments, setOverduePayments] =
    useState<Page<PaymentHistoryResponse> | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (!loanId) return;
    const currentLoanId = loanId;

    async function loadLoan() {
      setLoading(true);
      try {
        const { data } = await loansApi.getById(currentLoanId);
        setLoan(data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    void loadLoan();
  }, [loanId]);

  useEffect(() => {
    if (!loanId || !loan?.userId) return;
    const currentLoanId = loanId;
    const currentUserId = loan.userId;

    async function loadAnalytics() {
      setLoadingAnalytics(true);
      try {
        const [creditRatingResponse, overduePaymentsResponse] = await Promise.all([
          loansApi.getCreditRatingByUser(currentUserId),
          loansApi.getOverduePaymentsByLoan(currentLoanId, {
            page: 0,
            size: 10,
            sortBy: "expectedPaymentDate",
            sortDir: "DESC",
          }),
        ]);
        setCreditRating(creditRatingResponse.data);
        setOverduePayments(overduePaymentsResponse.data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoadingAnalytics(false);
      }
    }

    void loadAnalytics();
  }, [loan?.userId, loanId]);

  async function handleApprove() {
    if (!loan) return;
    try {
      await loansApi.approve(loan.id);
      toast.success("Кредит одобрен");
      const { data } = await loansApi.getById(loan.id);
      setLoan(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
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
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function formatMoney(val: number) {
    return Number(val).toLocaleString("ru-RU", {
      style: "currency",
      currency: "RUB",
    });
  }

  function formatCurrencyByCode(value: number, currencyCode: string) {
    return Number(value).toLocaleString("ru-RU", {
      style: "currency",
      currency: currencyCode,
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

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Кредитный рейтинг заёмщика</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAnalytics ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : !creditRating ? (
            <p className="text-muted-foreground text-sm">
              Не удалось загрузить кредитный рейтинг.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">Score</p>
                <p className="text-2xl font-semibold">{creditRating.score}</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">Grade</p>
                <p className="text-2xl font-semibold">{creditRating.grade}</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">Всего кредитов</p>
                <p className="text-2xl font-semibold">{creditRating.totalLoans}</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">Просрочек</p>
                <p className="text-2xl font-semibold">
                  {creditRating.overdueCount}
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">Активные</p>
                <p className="text-xl font-semibold">{creditRating.activeLoans}</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">Погашенные</p>
                <p className="text-xl font-semibold">{creditRating.paidLoans}</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">Штрафы</p>
                <p className="text-xl font-semibold">
                  {formatMoney(creditRating.totalPenalties)}
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">Новый кредит</p>
                <p className="text-xl font-semibold">
                  {creditRating.isEligibleForNewLoan ? "Доступен" : "Недоступен"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Просроченные платежи по кредиту</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAnalytics ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : !overduePayments || overduePayments.content.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Просроченных платежей по этому кредиту нет.
            </p>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Дата по плану</TableHead>
                    <TableHead>Факт</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Штраф</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overduePayments.content.map((payment) => (
                    <TableRow key={payment.paymentId}>
                      <TableCell>
                        {formatCurrencyByCode(
                          payment.paymentAmount,
                          payment.currencyCode
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(payment.expectedPaymentDate)}
                      </TableCell>
                      <TableCell>{formatDate(payment.actualPaymentDate)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "OVERDUE" ||
                            payment.status === "SKIPPED"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {PAYMENT_STATUS_LABELS[payment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrencyByCode(
                          payment.penaltyAmount,
                          payment.loanCurrencyCode
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
