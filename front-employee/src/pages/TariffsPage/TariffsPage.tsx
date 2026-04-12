import { useCallback, useEffect, useState } from "react";
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
import { tariffsApi } from "@/api/tariffs";
import type { TariffsFilterParams } from "@/api/tariffs";
import type { Page, TariffResponse } from "@/types";
import { CreateTariffDialog } from "./CreateTariffDialog";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  dismissRequestToast,
  showRequestErrorToast,
} from "@/lib/request-feedback";

const PAGE_SIZE = 10;
const TARIFFS_PAGE_ERROR_TOAST_ID = "tariffs-page-load-error";

export default function TariffsPage() {
  const [data, setData] = useState<Page<TariffResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchTariffs = useCallback(async () => {
    setLoading(true);
    try {
      const params: TariffsFilterParams = {
        page,
        size: PAGE_SIZE,
        sortBy: "id",
        sortDir: "ASC",
      };
      if (activeFilter !== "all") params.active = activeFilter === "true";
      const { data } = await tariffsApi.getAll(params);
      setData(data);
      setLoadError(null);
      dismissRequestToast(TARIFFS_PAGE_ERROR_TOAST_ID);
    } catch (error) {
      setLoadError(showRequestErrorToast(error, TARIFFS_PAGE_ERROR_TOAST_ID));
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  useEffect(() => {
    fetchTariffs();
  }, [fetchTariffs]);

  async function handleToggleActive(tariff: TariffResponse) {
    try {
      if (tariff.active) {
        await tariffsApi.deactivate(tariff.id);
        toast.success(`Тариф «${tariff.name}» деактивирован`);
      } else {
        await tariffsApi.activate(tariff.id);
        toast.success(`Тариф «${tariff.name}» активирован`);
      }
      fetchTariffs();
    } catch (error) {
      showRequestErrorToast(error, TARIFFS_PAGE_ERROR_TOAST_ID);
    }
  }

  function formatPercent(rate: number) {
    return `${(rate * 100).toFixed(0)}%`;
  }

  function formatMoney(val: number) {
    return Number(val).toLocaleString("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    });
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Кредитные тарифы</h1>
        <CreateTariffDialog onCreated={fetchTariffs} />
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={activeFilter}
          onValueChange={(v) => {
            setActiveFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="true">Активные</SelectItem>
            <SelectItem value="false">Неактивные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loadError && (
        <Alert>
          <AlertTitle>Не удалось обновить список тарифов</AlertTitle>
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
              <TableHead>Ставка</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Срок</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !data ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Тарифы не найдены
                </TableCell>
              </TableRow>
            ) : (
              data?.content.map((tariff) => (
                <TableRow key={tariff.id}>
                  <TableCell className="font-medium">{tariff.name}</TableCell>
                  <TableCell>{formatPercent(tariff.rate)}</TableCell>
                  <TableCell>
                    {formatMoney(tariff.minAmount)} –{" "}
                    {formatMoney(tariff.maxAmount)}
                  </TableCell>
                  <TableCell>
                    {tariff.minTermMonths} – {tariff.maxTermMonths} мес.
                  </TableCell>
                  <TableCell>
                    {tariff.active ? (
                      <Badge variant="secondary">Активен</Badge>
                    ) : (
                      <Badge variant="outline">Неактивен</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={tariff.active ? "outline" : "default"}
                      size="xs"
                      onClick={() => handleToggleActive(tariff)}
                    >
                      {tariff.active ? "Деактивировать" : "Активировать"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {loading && data && (
        <p className="text-sm text-muted-foreground">Обновляем список тарифов...</p>
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
