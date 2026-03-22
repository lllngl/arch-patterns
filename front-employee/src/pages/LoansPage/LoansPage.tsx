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
import { loansApi } from "@/api/loans";
import type { LoansFilterParams } from "@/api/loans";
import type { LoanResponse, LoanStatus, Page } from "@/types";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getErrorMessage } from "@/lib/http-error";

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING: "Ожидает",
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

export default function LoansPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Page<LoanResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params: LoansFilterParams = {
        page,
        size: PAGE_SIZE,
        sortBy: "createdAt",
        sortDir: "DESC",
      };
      if (statusFilter !== "all") params.status = statusFilter as LoanStatus;
      const { data } = await loansApi.getAll(params);
      setData(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  function formatMoney(val: number) {
    return Number(val).toLocaleString("ru-RU", {
      style: "currency",
      currency: "RUB",
    });
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Все кредиты</h1>

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
            <SelectItem value="PENDING">Ожидают</SelectItem>
            <SelectItem value="ACTIVE">Активные</SelectItem>
            <SelectItem value="PAID">Погашенные</SelectItem>
            <SelectItem value="OVERDUE">Просроченные</SelectItem>
            <SelectItem value="REJECTED">Отклонённые</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тариф</TableHead>
              <TableHead>Заёмщик</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Остаток</TableHead>
              <TableHead>Срок</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата выдачи</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Кредиты не найдены
                </TableCell>
              </TableRow>
            ) : (
              data?.content.map((loan) => (
                <TableRow
                  key={loan.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/loans/${loan.id}`)}
                >
                  <TableCell className="font-medium">
                    {loan.tariff?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/users/${loan.userId}`}
                      className="text-primary hover:underline font-mono text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {loan.userId.slice(0, 8)}...
                    </Link>
                  </TableCell>
                  <TableCell>{formatMoney(loan.amount)}</TableCell>
                  <TableCell>{formatMoney(loan.remainingAmount)}</TableCell>
                  <TableCell>{loan.termMonths} мес.</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[loan.status]}>
                      {STATUS_LABELS[loan.status] ?? loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(loan.createdAt).toLocaleDateString("ru-RU")}
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
