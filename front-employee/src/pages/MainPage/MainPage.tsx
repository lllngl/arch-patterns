import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthStore } from "@/stores/auth";
import { Users, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { loadDashboardStats, type DashboardStats } from "@/use-cases/dashboard/load-dashboard-stats";
import {
  dismissRequestToast,
  showRequestErrorToast,
} from "@/lib/request-feedback";

const DASHBOARD_ERROR_TOAST_ID = "dashboard-stats-load-error";

export default function MainPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await loadDashboardStats());
      setLoadError(null);
      dismissRequestToast(DASHBOARD_ERROR_TOAST_ID);
    } catch (error) {
      setLoadError(showRequestErrorToast(error, DASHBOARD_ERROR_TOAST_ID));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Добро пожаловать{user ? `, ${user.firstName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Панель управления сотрудника банка
        </p>
      </div>

      {loadError && (
        <Alert>
          <AlertTitle>Не удалось обновить сводку</AlertTitle>
          <AlertDescription>
            {stats ? "Показываем последние доступные данные. " : ""}
            {loadError}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {loading && !stats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalUsers ?? "—"}
              </div>
            )}
            <p className="text-muted-foreground text-xs mt-1">
              Всего зарегистрировано
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Счета</CardTitle>
            <Wallet className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {loading && !stats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalAccounts ?? "—"}
              </div>
            )}
            <p className="text-muted-foreground text-xs mt-1">Всего открыто</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Управление пользователями
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Просмотр, создание и блокировка клиентов и сотрудников.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/users">
                Перейти <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Все счета</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Просмотр всех счетов клиентов и истории операций.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/accounts">
                Перейти <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
