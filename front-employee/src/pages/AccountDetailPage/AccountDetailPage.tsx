import { useCallback, useEffect, useState } from "react";
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
import { accountsApi } from "@/api/accounts";
import type { TransactionsFilterParams } from "@/api/accounts";
import type {
  AccountDTO,
  AccountTransactionDTO,
  Page,
  TransactionType,
} from "@/types";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { HiddenAccountToggle } from "@/components/custom/HiddenAccountToggle";
import { LiveConnectionBadge } from "@/components/custom/LiveConnectionBadge";
import { getErrorMessage } from "@/lib/http-error";
import { useLiveAccountTransactions } from "@/use-cases/accounts/use-live-account-transactions";
import {
  dismissRequestToast,
  showRequestErrorToast,
} from "@/lib/request-feedback";

const PAGE_SIZE = 15;
const ACCOUNT_DETAIL_ERROR_TOAST_ID = "account-detail-load-error";
const ACCOUNT_TRANSACTIONS_ERROR_TOAST_ID = "account-transactions-load-error";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Открыт",
  CLOSED: "Закрыт",
};

const TYPE_LABELS: Record<string, string> = {
  INCOME: "Пополнение",
  EXPENSE: "Списание",
};

const LIVE_CONNECTION_MESSAGES = {
  connected: null,
  connecting: {
    title: "Realtime подключается",
    description:
      "События по операциям скоро начнут приходить через WebSocket/STOMP.",
  },
  idle: {
    title: "Realtime сейчас неактивен",
    description:
      "Соединение закрыто. История операций продолжает загружаться через REST.",
  },
  disabled: {
    title: "Realtime отключён",
    description:
      "Не хватает токена или WebSocket URL. Экран работает в режиме REST only.",
  },
  error: {
    title: "Ошибка WebSocket",
    description:
      "Push invalidation недоступен. Пока backend не восстановится, список обновляется только через REST.",
  },
} as const;

export default function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountDTO | null>(null);
  const [transactions, setTransactions] =
    useState<Page<AccountTransactionDTO> | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txPage, setTxPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accountLoadError, setAccountLoadError] = useState<string | null>(null);
  const [transactionsLoadError, setTransactionsLoadError] = useState<string | null>(
    null
  );

  const fetchAccount = useCallback(async () => {
    if (!accountId) return;

    setLoadingAccount(true);
    try {
      const { data } = await accountsApi.getById(accountId);
      setAccount(data);
      setAccountLoadError(null);
      dismissRequestToast(ACCOUNT_DETAIL_ERROR_TOAST_ID);
    } catch (error) {
      setAccountLoadError(
        showRequestErrorToast(error, ACCOUNT_DETAIL_ERROR_TOAST_ID)
      );
    } finally {
      setLoadingAccount(false);
    }
  }, [accountId]);

  useEffect(() => {
    void fetchAccount();
  }, [fetchAccount]);

  const fetchTransactions = useCallback(async () => {
    if (!accountId) return;
    setLoadingTx(true);
    try {
      const params: TransactionsFilterParams = {
        page: txPage,
        size: PAGE_SIZE,
        sortBy: "createdAt",
        sortDir: "DESC",
      };
      if (typeFilter !== "all") params.type = typeFilter as TransactionType;
      if (fromDate) params.fromDate = new Date(fromDate).toISOString();
      if (toDate) params.toDate = new Date(toDate + "T23:59:59").toISOString();
      const { data } = await accountsApi.getTransactions(accountId, params);
      setTransactions(data);
      setTransactionsLoadError(null);
      dismissRequestToast(ACCOUNT_TRANSACTIONS_ERROR_TOAST_ID);
    } catch (error) {
      setTransactionsLoadError(
        showRequestErrorToast(error, ACCOUNT_TRANSACTIONS_ERROR_TOAST_ID)
      );
    } finally {
      setLoadingTx(false);
    }
  }, [accountId, txPage, typeFilter, fromDate, toDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAccountInvalidated = useCallback(() => {
    void fetchAccount();
    void fetchTransactions();
  }, [fetchAccount, fetchTransactions]);

  const connectionState = useLiveAccountTransactions(
    accountId,
    handleAccountInvalidated
  );

  async function handleDeleteAccount() {
    if (!account) return;
    if (!window.confirm("Удалить этот счёт? Действие необратимо.")) return;
    try {
      await accountsApi.delete(account.id);
      toast.success("Счёт удалён");
      navigate("/accounts");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (loadingAccount && !account) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full max-w-2xl" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-6 space-y-4">
        {accountLoadError ? (
          <Alert>
            <AlertTitle>Не удалось загрузить счёт</AlertTitle>
            <AlertDescription>{accountLoadError}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-muted-foreground">Счёт не найден</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/accounts">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {account.name || "Счёт"}
        </h1>
        <Badge variant={account.status === "OPEN" ? "secondary" : "outline"}>
          {STATUS_LABELS[account.status] ?? account.status}
        </Badge>
        <LiveConnectionBadge state={connectionState} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <HiddenAccountToggle accountId={account.id} />
        <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
          <Trash2 /> Удалить счёт
        </Button>
      </div>

      {accountLoadError && (
        <Alert>
          <AlertTitle>Не удалось обновить данные счёта</AlertTitle>
          <AlertDescription>
            Показываем последние успешно загруженные данные. {accountLoadError}
          </AlertDescription>
        </Alert>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Информация о счёте</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono text-xs">{account.id}</span>

            <span className="text-muted-foreground">Владелец</span>
            <Link
              to={`/users/${account.userId}`}
              className="text-primary hover:underline font-mono text-xs"
            >
              {account.userId}
            </Link>

            <span className="text-muted-foreground">Баланс</span>
            <span className="font-semibold">
              {Number(account.balance).toLocaleString("ru-RU", {
                style: "currency",
                currency: "RUB",
              })}
            </span>

            <span className="text-muted-foreground">Создан</span>
            <span>{new Date(account.createdAt).toLocaleString("ru-RU")}</span>

            <span className="text-muted-foreground">Изменён</span>
            <span>{new Date(account.modifiedAt).toLocaleString("ru-RU")}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">История операций</h2>
        </div>

        {LIVE_CONNECTION_MESSAGES[connectionState] && (
          <Alert>
            <AlertTitle>
              {LIVE_CONNECTION_MESSAGES[connectionState].title}
            </AlertTitle>
            <AlertDescription>
              {LIVE_CONNECTION_MESSAGES[connectionState].description}
            </AlertDescription>
          </Alert>
        )}

        {transactionsLoadError && (
          <Alert>
            <AlertTitle>Не удалось обновить операции</AlertTitle>
            <AlertDescription>
              {transactions
                ? "Показываем последние успешно загруженные данные. "
                : ""}
              {transactionsLoadError}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5">
            <Label className="text-xs">Тип</Label>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setTxPage(0);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="INCOME">Пополнение</SelectItem>
                <SelectItem value="EXPENSE">Списание</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">С</Label>
            <Input
              type="date"
              className="w-[160px]"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setTxPage(0);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">По</Label>
            <Input
              type="date"
              className="w-[160px]"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setTxPage(0);
              }}
            />
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTx && !transactions ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : transactions?.content.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Операции не найдены
                  </TableCell>
                </TableRow>
              ) : (
                transactions?.content.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {tx.type === "INCOME" ? (
                        <ArrowDown className="size-4 text-green-600" />
                      ) : (
                        <ArrowUp className="size-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tx.type === "INCOME" ? "secondary" : "outline"}
                      >
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={
                        tx.type === "INCOME"
                          ? "text-green-600 font-medium"
                          : "text-red-500 font-medium"
                      }
                    >
                      {tx.type === "INCOME" ? "+" : "−"}
                      {Number(tx.amount).toLocaleString("ru-RU", {
                        style: "currency",
                        currency: "RUB",
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.description || "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(tx.createdAt).toLocaleString("ru-RU")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {loadingTx && transactions && (
          <p className="text-sm text-muted-foreground">Обновляем операции...</p>
        )}

        {transactions && transactions.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Страница {transactions.number + 1} из {transactions.totalPages}{" "}
              (всего {transactions.totalElements})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={transactions.first}
                onClick={() => setTxPage((p) => p - 1)}
              >
                <ChevronLeft /> Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={transactions.last}
                onClick={() => setTxPage((p) => p + 1)}
              >
                Вперёд <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
