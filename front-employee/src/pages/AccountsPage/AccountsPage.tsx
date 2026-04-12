import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { accountsApi } from "@/api/accounts";
import type { AccountsFilterParams } from "@/api/accounts";
import type { AccountDTO, AccountStatus, Page } from "@/types";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useAppSettingsStore } from "@/stores/app-settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  dismissRequestToast,
  showRequestErrorToast,
} from "@/lib/request-feedback";
import { EMPLOYEE_OPERATION_EVENT_NAME } from "@/network/ws/account-transactions";

const PAGE_SIZE = 10;
const ACCOUNTS_PAGE_ERROR_TOAST_ID = "accounts-page-load-error";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Открыт",
  CLOSED: "Закрыт",
};

export default function AccountsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Page<AccountDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const hiddenAccountIds = useAppSettingsStore((state) => state.hiddenAccountIds);
  const isAccountHidden = useAppSettingsStore((state) => state.isAccountHidden);
  const [showHiddenAccounts, setShowHiddenAccounts] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params: AccountsFilterParams = {
        page,
        size: PAGE_SIZE,
        sortBy: "id",
        sortDir: "ASC",
      };
      if (statusFilter !== "all") {
        params.status = [statusFilter as AccountStatus];
      }
      const { data } = await accountsApi.getAll(params);
      setData(data);
      setLoadError(null);
      dismissRequestToast(ACCOUNTS_PAGE_ERROR_TOAST_ID);
    } catch (error) {
      setLoadError(showRequestErrorToast(error, ACCOUNTS_PAGE_ERROR_TOAST_ID));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const visibleAccounts =
    data?.content.filter(
      (account) => showHiddenAccounts || !isAccountHidden(account.id)
    ) ?? [];

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    function handleEmployeeOperation() {
      void fetchAccounts();
    }

    window.addEventListener(EMPLOYEE_OPERATION_EVENT_NAME, handleEmployeeOperation);
    return () => {
      window.removeEventListener(
        EMPLOYEE_OPERATION_EVENT_NAME,
        handleEmployeeOperation
      );
    };
  }, [fetchAccounts]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Все счета</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="OPEN">Открытые</SelectItem>
            <SelectItem value="CLOSED">Закрытые</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHiddenAccounts((value) => !value)}
        >
          {showHiddenAccounts ? <EyeOff /> : <Eye />}
          {showHiddenAccounts
            ? "Скрыть отмеченные счета"
            : `Показать скрытые (${hiddenAccountIds.length})`}
        </Button>
      </div>

      {loadError && (
        <Alert>
          <AlertTitle>Не удалось обновить список счетов</AlertTitle>
          <AlertDescription>
            {data
              ? "Показываем последние успешно загруженные данные. "
              : ""}
            {loadError}
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Владелец (ID)</TableHead>
              <TableHead>Баланс</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Создан</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !data ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : visibleAccounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  {data?.content.length
                    ? "Все счета скрыты настройками приложения"
                    : "Счета не найдены"}
                </TableCell>
              </TableRow>
            ) : (
              visibleAccounts.map((account) => {
                const ownerId = account.userId;

                return (
                  <TableRow
                    key={account.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/accounts/${account.id}`)}
                  >
                    <TableCell className="font-medium">
                      {account.name || "Без названия"}
                    </TableCell>
                    <TableCell>
                      {ownerId ? (
                        <Link
                          to={`/users/${ownerId}`}
                          className="text-primary hover:underline text-xs font-mono"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ownerId.slice(0, 8)}...
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Системный счёт
                        </span>
                      )}
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
                      {isAccountHidden(account.id) && (
                        <Badge variant="outline" className="ml-2">
                          Скрыт в приложении
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(account.createdAt).toLocaleDateString("ru-RU")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {loading && data && (
        <p className="text-sm text-muted-foreground">Обновляем список счетов...</p>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Страница {data.number + 1} из {data.totalPages} (всего{" "}
            {data.totalElements})
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft /> Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
