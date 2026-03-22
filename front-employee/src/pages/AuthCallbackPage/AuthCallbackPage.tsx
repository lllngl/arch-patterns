import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { getErrorMessage } from "@/lib/http-error";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const completeSsoLogin = useAuthStore((state) => state.completeSsoLogin);
  const user = useAuthStore((state) => state.user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    completeSsoLogin(searchParams).then(
      () => {
        navigate("/", { replace: true });
      },
      (reason) => {
        setError(getErrorMessage(reason));
      }
    );
  }, [completeSsoLogin, navigate, searchParams]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="bg-muted min-h-screen">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="border-muted bg-background flex w-full max-w-md flex-col items-center gap-4 rounded-md border px-8 py-10 text-center shadow-md">
          {error ? (
            <>
              <ShieldAlert className="text-destructive size-8" />
              <h1 className="text-xl font-semibold">Не удалось завершить SSO</h1>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button onClick={() => navigate("/login", { replace: true })}>
                Вернуться ко входу
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="size-8 animate-spin" />
              <h1 className="text-xl font-semibold">Завершаем вход</h1>
              <p className="text-muted-foreground text-sm">
                Проверяем callback Keycloak и загружаем профиль сотрудника.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
