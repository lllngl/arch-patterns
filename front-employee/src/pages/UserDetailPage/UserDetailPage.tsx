import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usersApi } from "@/api/users";
import { accountsApi } from "@/api/accounts";
import { loansApi } from "@/api/loans";
import type { LoansFilterParams } from "@/api/loans";
import type {
  CreditRatingResponse,
  UserDTO,
  AccountDTO,
  LoanResponse,
  LoanStatus,
  Page,
  Gender,
  PaymentHistoryResponse,
  PaymentStatus,
} from "@/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  LockOpen,
  Pencil,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { getErrorMessage } from "@/lib/http-error";
import { RoleBadges } from "@/components/custom/RoleBadges";
import {
  dismissRequestToast,
  showRequestErrorToast,
} from "@/lib/request-feedback";

const GENDER_LABELS: Record<string, string> = {
  MALE: "Мужской",
  FEMALE: "Женский",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Открыт",
  CLOSED: "Закрыт",
};

const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING: "Ожидает",
  ACTIVE: "Активен",
  PAID: "Погашен",
  OVERDUE: "Просрочен",
  REJECTED: "Отклонён",
};

const LOAN_STATUS_VARIANT: Record<
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

const PAGE_SIZE = 10;
const USER_DETAIL_ERROR_TOAST_ID = "user-detail-load-error";
const USER_DETAIL_ACCOUNTS_ERROR_TOAST_ID = "user-detail-accounts-load-error";
const USER_DETAIL_LOANS_ERROR_TOAST_ID = "user-detail-loans-load-error";
const USER_DETAIL_ANALYTICS_ERROR_TOAST_ID = "user-detail-analytics-load-error";

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [accounts, setAccounts] = useState<Page<AccountDTO> | null>(null);
  const [loans, setLoans] = useState<Page<LoanResponse> | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [accountPage, setAccountPage] = useState(0);
  const [loanPage, setLoanPage] = useState(0);
  const [loanStatusFilter, setLoanStatusFilter] = useState<string>("all");
  const [creditRating, setCreditRating] = useState<CreditRatingResponse | null>(
    null
  );
  const [overduePayments, setOverduePayments] =
    useState<Page<PaymentHistoryResponse> | null>(null);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);
  const [accountsLoadError, setAccountsLoadError] = useState<string | null>(null);
  const [loansLoadError, setLoansLoadError] = useState<string | null>(null);
  const [analyticsLoadError, setAnalyticsLoadError] = useState<string | null>(
    null
  );

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGender, setEditGender] = useState<Gender>("MALE");
  const [editBirthDate, setEditBirthDate] = useState("");

  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;
    setLoadingUser(true);
    try {
      const { data } = await usersApi.getById(userId);
      setUser(data);
      setUserLoadError(null);
      dismissRequestToast(USER_DETAIL_ERROR_TOAST_ID);
    } catch (error) {
      setUserLoadError(showRequestErrorToast(error, USER_DETAIL_ERROR_TOAST_ID));
    } finally {
      setLoadingUser(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchUserDetails();
  }, [fetchUserDetails]);

  const fetchAccounts = useCallback(async () => {
    if (!userId) return;
    setLoadingAccounts(true);
    try {
      const { data } = await accountsApi.getUserAccounts(userId, {
        page: accountPage,
        size: PAGE_SIZE,
        sortBy: "id",
        sortDir: "ASC",
      });
      setAccounts(data);
      setAccountsLoadError(null);
      dismissRequestToast(USER_DETAIL_ACCOUNTS_ERROR_TOAST_ID);
    } catch (error) {
      setAccountsLoadError(
        showRequestErrorToast(error, USER_DETAIL_ACCOUNTS_ERROR_TOAST_ID)
      );
    } finally {
      setLoadingAccounts(false);
    }
  }, [userId, accountPage]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const fetchLoans = useCallback(async () => {
    if (!userId) return;
    setLoadingLoans(true);
    try {
      const params: LoansFilterParams = {
        page: loanPage,
        size: PAGE_SIZE,
        sortBy: "createdAt",
        sortDir: "DESC",
      };
      if (loanStatusFilter !== "all")
        params.status = loanStatusFilter as LoanStatus;
      const { data } = await loansApi.getByUser(userId, params);
      setLoans(data);
      setLoansLoadError(null);
      dismissRequestToast(USER_DETAIL_LOANS_ERROR_TOAST_ID);
    } catch (error) {
      setLoansLoadError(
        showRequestErrorToast(error, USER_DETAIL_LOANS_ERROR_TOAST_ID)
      );
    } finally {
      setLoadingLoans(false);
    }
  }, [userId, loanPage, loanStatusFilter]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const fetchAnalytics = useCallback(async () => {
    if (!userId) return;

    setLoadingAnalytics(true);
    try {
      const [creditRatingResponse, overduePaymentsResponse] = await Promise.all([
        loansApi.getCreditRatingByUser(userId),
        loansApi.getOverduePaymentsByUser(userId, {
          page: 0,
          size: PAGE_SIZE,
          sortBy: "expectedPaymentDate",
          sortDir: "DESC",
        }),
      ]);
      setCreditRating(creditRatingResponse.data);
      setOverduePayments(overduePaymentsResponse.data);
      setAnalyticsLoadError(null);
      dismissRequestToast(USER_DETAIL_ANALYTICS_ERROR_TOAST_ID);
    } catch (error) {
      setAnalyticsLoadError(
        showRequestErrorToast(error, USER_DETAIL_ANALYTICS_ERROR_TOAST_ID)
      );
    } finally {
      setLoadingAnalytics(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  function startEditing() {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPatronymic(user.patronymic ?? "");
    setEditEmail(user.email);
    setEditPhone(user.phone ? String(user.phone) : "");
    setEditGender(user.gender as Gender);
    setEditBirthDate(user.birthDate ?? "");
    setEditing(true);
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { data } = await usersApi.update(user.id, {
        firstName,
        lastName,
        patronymic: patronymic || undefined,
        email: editEmail,
        phone: editPhone ? Number(editPhone) : undefined,
        gender: editGender,
        birthDate: editBirthDate || undefined,
      });
      setUser(data);
      setEditing(false);
      toast.success("Данные обновлены");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBlock() {
    if (!user) return;
    try {
      if (user.isBlocked) {
        await usersApi.unblock(user.id);
        toast.success("Пользователь разблокирован");
      } else {
        await usersApi.block(user.id);
        toast.success("Пользователь заблокирован");
      }
      const { data } = await usersApi.getById(user.id);
      setUser(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleDelete() {
    if (!user) return;
    if (!window.confirm(`Удалить пользователя ${user.email}?`)) return;
    try {
      await usersApi.delete(user.id);
      toast.success("Пользователь удалён");
      navigate("/users");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (loadingUser && !user) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full max-w-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 space-y-4">
        {userLoadError ? (
          <Alert>
            <AlertTitle>Не удалось загрузить пользователя</AlertTitle>
            <AlertDescription>{userLoadError}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-muted-foreground">Пользователь не найден</p>
        )}
      </div>
    );
  }

  const fullName = [user.lastName, user.firstName, user.patronymic]
    .filter(Boolean)
    .join(" ");

  function formatDate(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("ru-RU");
  }

  function formatCurrencyByCode(value: number, currencyCode: string) {
    return Number(value).toLocaleString("ru-RU", {
      style: "currency",
      currency: currencyCode,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/users">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
        {user.isBlocked && <Badge variant="destructive">Заблокирован</Badge>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={user.isBlocked ? "outline" : "destructive"}
          size="sm"
          onClick={handleToggleBlock}
        >
          {user.isBlocked ? <LockOpen /> : <Lock />}
          {user.isBlocked ? "Разблокировать" : "Заблокировать"}
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 /> Удалить
        </Button>
      </div>

      {userLoadError && (
        <Alert>
          <AlertTitle>Не удалось обновить карточку пользователя</AlertTitle>
          <AlertDescription>
            Показываем последние успешно загруженные данные. {userLoadError}
          </AlertDescription>
        </Alert>
      )}

      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Информация</CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil /> Редактировать
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ud-lastName">Фамилия</Label>
                  <Input
                    id="ud-lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    maxLength={85}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ud-firstName">Имя</Label>
                  <Input
                    id="ud-firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    maxLength={85}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ud-patronymic">Отчество</Label>
                <Input
                  id="ud-patronymic"
                  value={patronymic}
                  onChange={(e) => setPatronymic(e.target.value)}
                  maxLength={85}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ud-email">Email</Label>
                  <Input
                    id="ud-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ud-phone">Телефон</Label>
                  <Input
                    id="ud-phone"
                    type="tel"
                    value={editPhone}
                    onChange={(e) =>
                      setEditPhone(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="79001234567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Пол</Label>
                  <Select
                    value={editGender}
                    onValueChange={(v) => setEditGender(v as Gender)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Мужской</SelectItem>
                      <SelectItem value="FEMALE">Женский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ud-birth">Дата рождения</Label>
                  <Input
                    id="ud-birth"
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />}
                  Сохранить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  <X /> Отмена
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>

              <span className="text-muted-foreground">Телефон</span>
              <span>{user.phone ? `+${user.phone}` : "—"}</span>

              <span className="text-muted-foreground">Пол</span>
              <span>{GENDER_LABELS[user.gender] ?? user.gender}</span>

              <span className="text-muted-foreground">Дата рождения</span>
              <span>
                {user.birthDate
                  ? new Date(user.birthDate).toLocaleDateString("ru-RU")
                  : "—"}
              </span>

              <span className="text-muted-foreground">Роли</span>
              <span>
                <RoleBadges roles={user.roles} variant="secondary" />
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Счета пользователя</h2>

        {accountsLoadError && (
          <Alert>
            <AlertTitle>Не удалось обновить счета пользователя</AlertTitle>
            <AlertDescription>
              {accounts ? "Показываем последние успешно загруженные данные. " : ""}
              {accountsLoadError}
            </AlertDescription>
          </Alert>
        )}

        {loadingAccounts && !accounts ? (
          <div className="border rounded-md p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : !accounts || accounts.content.length === 0 ? (
          <div className="border rounded-md flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="size-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">
              У пользователя нет счетов
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Счета появятся здесь после создания клиентом
            </p>
          </div>
        ) : (
          <>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Баланс</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата создания</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.content.map((account) => (
                    <TableRow
                      key={account.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/accounts/${account.id}`)}
                    >
                      <TableCell className="font-medium">
                        {account.name || "Без названия"}
                      </TableCell>
                      <TableCell>
                        {Number(account.balance).toLocaleString("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            account.status === "OPEN" ? "secondary" : "outline"
                          }
                        >
                          {STATUS_LABELS[account.status] ?? account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(account.createdAt).toLocaleDateString(
                          "ru-RU"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {accounts.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Страница {accounts.number + 1} из {accounts.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={accounts.first}
                    onClick={() => setAccountPage((p) => p - 1)}
                  >
                    <ChevronLeft /> Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={accounts.last}
                    onClick={() => setAccountPage((p) => p + 1)}
                  >
                    Вперёд <ChevronRight />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {loadingAccounts && accounts && (
          <p className="text-sm text-muted-foreground">Обновляем счета пользователя...</p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Кредиты пользователя</h2>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="border rounded-md p-4 bg-muted/40 space-y-3">
            <p className="font-medium">Кредитная аналитика</p>
            {analyticsLoadError && (
              <Alert>
                <AlertTitle>Не удалось обновить кредитную аналитику</AlertTitle>
                <AlertDescription>
                  {creditRating || overduePayments
                    ? "Показываем последние успешно загруженные данные. "
                    : ""}
                  {analyticsLoadError}
                </AlertDescription>
              </Alert>
            )}
            {loadingAnalytics && !creditRating ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-full" />
                ))}
              </div>
            ) : !creditRating ? (
              <p className="text-muted-foreground text-sm">
                Не удалось загрузить кредитный рейтинг.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">Score</p>
                  <p className="text-xl font-semibold">{creditRating.score}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Grade</p>
                  <p className="text-xl font-semibold">{creditRating.grade}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Просрочки</p>
                  <p className="text-lg font-semibold">
                    {creditRating.overdueCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Новый кредит</p>
                  <p className="text-lg font-semibold">
                    {creditRating.isEligibleForNewLoan ? "Доступен" : "Недоступен"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Штрафы</p>
                  <p className="text-lg font-semibold">
                    {Number(creditRating.totalPenalties).toLocaleString("ru-RU", {
                      style: "currency",
                      currency: "RUB",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Последняя просрочка</p>
                  <p className="text-lg font-semibold">
                    {formatDate(creditRating.lastOverdueDate)}
                  </p>
                </div>
              </div>
            )}
            {loadingAnalytics && creditRating && (
              <p className="text-sm text-muted-foreground">
                Обновляем кредитную аналитику...
              </p>
            )}
          </div>

          <div className="border rounded-md p-4 space-y-3">
            <p className="font-medium">Просроченные платежи</p>
            {loadingAnalytics && !overduePayments ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : !overduePayments || overduePayments.content.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Просроченных платежей у пользователя нет.
              </p>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Сумма</TableHead>
                      <TableHead>План</TableHead>
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
                        <TableCell>{formatDate(payment.expectedPaymentDate)}</TableCell>
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
            {loadingAnalytics && overduePayments && (
              <p className="text-sm text-muted-foreground">
                Обновляем просроченные платежи...
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={loanStatusFilter}
            onValueChange={(v) => {
              setLoanStatusFilter(v);
              setLoanPage(0);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="PENDING">Ожидают</SelectItem>
              <SelectItem value="ACTIVE">Активные</SelectItem>
              <SelectItem value="PAID">Погашенные</SelectItem>
              <SelectItem value="OVERDUE">Просроченные</SelectItem>
              <SelectItem value="REJECTED">Отклонённые</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loansLoadError && (
          <Alert>
            <AlertTitle>Не удалось обновить кредиты пользователя</AlertTitle>
            <AlertDescription>
              {loans ? "Показываем последние успешно загруженные данные. " : ""}
              {loansLoadError}
            </AlertDescription>
          </Alert>
        )}

        {loadingLoans && !loans ? (
          <div className="border rounded-md p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : !loans || loans.content.length === 0 ? (
          <div className="border rounded-md flex flex-col items-center justify-center py-12 text-center">
            <Banknote className="size-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">
              У пользователя нет кредитов
            </p>
          </div>
        ) : (
          <>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тариф</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Остаток</TableHead>
                    <TableHead>Срок</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.content.map((loan) => (
                    <TableRow
                      key={loan.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/loans/${loan.id}`)}
                    >
                      <TableCell className="font-medium">
                        {loan.tariff?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        {Number(loan.amount).toLocaleString("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                        })}
                      </TableCell>
                      <TableCell>
                        {Number(loan.remainingAmount).toLocaleString("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                        })}
                      </TableCell>
                      <TableCell>{loan.termMonths} мес.</TableCell>
                      <TableCell>
                        <Badge variant={LOAN_STATUS_VARIANT[loan.status]}>
                          {LOAN_STATUS_LABELS[loan.status] ?? loan.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {loans.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Страница {loans.number + 1} из {loans.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loans.first}
                    onClick={() => setLoanPage((p) => p - 1)}
                  >
                    <ChevronLeft /> Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loans.last}
                    onClick={() => setLoanPage((p) => p + 1)}
                  >
                    Вперёд <ChevronRight />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {loadingLoans && loans && (
          <p className="text-sm text-muted-foreground">Обновляем кредиты пользователя...</p>
        )}
      </div>
    </div>
  );
}
