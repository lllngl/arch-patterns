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
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

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
    } catch {
      toast.error("Ошибка загрузки счетов");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Все счета</h1>

      <div className="flex items-center gap-3">
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
      </div>

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
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Счета не найдены
                </TableCell>
              </TableRow>
            ) : (
              data?.content.map((account) => (
                <TableRow
                  key={account.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/accounts/${account.id}`)}
                >
                  <TableCell className="font-medium">
                    {account.name || "Без названия"}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/users/${account.userId}`}
                      className="text-primary hover:underline text-xs font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {account.userId.slice(0, 8)}...
                    </Link>
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
                    {new Date(account.createdAt).toLocaleDateString("ru-RU")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
