import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { monitoringApi } from "@/api/monitoring";
import type {
  RecentTelemetryErrorResponse,
  TelemetrySource,
  TelemetrySummaryResponse,
  TelemetryTimelinePointResponse,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  dismissRequestToast,
  showRequestErrorToast,
} from "@/lib/request-feedback";

const MONITORING_ERROR_TOAST_ID = "monitoring-page-load-error";

function toLocalIso(value: Date) {
  return value.toISOString();
}

function formatBucket(value: string) {
  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MonitoringPage() {
  const [source, setSource] = useState<TelemetrySource>("FRONTEND");
  const [serviceName, setServiceName] = useState("");
  const [windowMinutes, setWindowMinutes] = useState("60");
  const [bucketMinutes, setBucketMinutes] = useState("5");

  const [summary, setSummary] = useState<TelemetrySummaryResponse | null>(null);
  const [timeline, setTimeline] = useState<TelemetryTimelinePointResponse[]>([]);
  const [recentErrors, setRecentErrors] = useState<RecentTelemetryErrorResponse[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMonitoring = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const fromDate = new Date(
      now.getTime() - Number(windowMinutes || "60") * 60 * 1000
    );
    const from = toLocalIso(fromDate);
    const to = toLocalIso(now);
    const bucket = Number(bucketMinutes || "5");
    const trimmedServiceName = serviceName.trim();

    const filters = {
      source,
      from,
      to,
      serviceName: trimmedServiceName.length > 0 ? trimmedServiceName : undefined,
    };

    try {
      const [summaryResponse, timelineResponse, errorsResponse] =
        await Promise.all([
          monitoringApi.getSummary(filters),
          monitoringApi.getTimeline({
            ...filters,
            bucketMinutes: bucket,
          }),
          monitoringApi.getRecentErrors({
            source,
            serviceName: filters.serviceName,
            limit: 20,
          }),
        ]);

      setSummary(summaryResponse.data);
      setTimeline(timelineResponse.data);
      setRecentErrors(errorsResponse.data);
      setLoadError(null);
      dismissRequestToast(MONITORING_ERROR_TOAST_ID);
    } catch (error) {
      setLoadError(showRequestErrorToast(error, MONITORING_ERROR_TOAST_ID));
    } finally {
      setLoading(false);
    }
  }, [bucketMinutes, serviceName, source, windowMinutes]);

  useEffect(() => {
    void loadMonitoring();
  }, [loadMonitoring]);

  const timelineChartData = useMemo(
    () =>
      timeline.map((point) => ({
        ...point,
        bucketLabel: formatBucket(point.bucketStart),
      })),
    [timeline]
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Мониторинг</h1>
        <p className="text-muted-foreground mt-1">
          Метрики времени ответа, ошибок и retry/circuit-breaker событий.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Select value={source} onValueChange={(value) => setSource(value as TelemetrySource)}>
          <SelectTrigger>
            <SelectValue placeholder="Источник" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FRONTEND">Frontend</SelectItem>
            <SelectItem value="BACKEND">Backend</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={serviceName}
          onChange={(event) => setServiceName(event.target.value)}
          placeholder="Имя сервиса (опционально)"
        />
        <Select value={windowMinutes} onValueChange={setWindowMinutes}>
          <SelectTrigger>
            <SelectValue placeholder="Окно" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 минут</SelectItem>
            <SelectItem value="60">1 час</SelectItem>
            <SelectItem value="180">3 часа</SelectItem>
            <SelectItem value="360">6 часов</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={bucketMinutes} onValueChange={setBucketMinutes}>
            <SelectTrigger>
              <SelectValue placeholder="Бакет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 минута</SelectItem>
              <SelectItem value="5">5 минут</SelectItem>
              <SelectItem value="10">10 минут</SelectItem>
              <SelectItem value="15">15 минут</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => void loadMonitoring()} disabled={loading}>
            Обновить
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert>
          <AlertTitle>Не удалось загрузить отчёт</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего запросов</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !summary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{summary?.totalRequests ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ошибки</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !summary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{summary?.errorRequests ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error rate</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !summary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">
                {Number(summary?.errorRatePercent ?? 0).toFixed(1)}%
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Средний ответ</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !summary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">
                {Math.round(summary?.averageDurationMs ?? 0)} мс
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Динамика error rate и latency</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucketLabel" />
                <YAxis yAxisId="left" unit="%" />
                <YAxis yAxisId="right" orientation="right" unit="мс" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="errorRatePercent"
                  name="Error rate %"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="averageDurationMs"
                  name="Средняя длительность, мс"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Объём запросов по бакетам</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucketLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalRequests" name="Всего" fill="#2563eb" />
                <Bar dataKey="errorRequests" name="Ошибки" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Последние ошибки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Время</TableHead>
                  <TableHead>Сервис</TableHead>
                  <TableHead>Метод</TableHead>
                  <TableHead>Путь</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Длительность</TableHead>
                  <TableHead>Trace ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentErrors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Ошибок не найдено для выбранного фильтра.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentErrors.map((error) => (
                    <TableRow key={`${error.traceId}-${error.occurredAt}`}>
                      <TableCell>
                        {new Date(error.occurredAt).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell>{error.serviceName}</TableCell>
                      <TableCell>{error.method}</TableCell>
                      <TableCell className="max-w-[260px] truncate">
                        {error.path}
                      </TableCell>
                      <TableCell>{error.statusCode}</TableCell>
                      <TableCell>{error.durationMs} мс</TableCell>
                      <TableCell className="font-mono text-xs">
                        {error.traceId}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
