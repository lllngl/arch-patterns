import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import { appEnv } from "@/config/env";
import { buildSsoBlockerReason } from "@/use-cases/auth/sso";
import { getErrorMessage } from "@/lib/http-error";
import { hasRole } from "@/lib/roles";
import { ExternalLink, Loader2, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const loginWithSso = useAuthStore((s) => s.loginWithSso);
  const loginWithSsoAsDifferentUser = useAuthStore(
    (s) => s.loginWithSsoAsDifferentUser
  );
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ssoBlocker = buildSsoBlockerReason();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (!hasRole(user, "EMPLOYEE")) {
        setError("У вас нет доступа к этой странице.");
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSsoLogin() {
    setLoading(true);
    setError("");
    try {
      await loginWithSso();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  async function handleSsoLoginAsDifferentUser() {
    setLoading(true);
    setError("");
    try {
      await loginWithSsoAsDifferentUser();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <section className="bg-muted min-h-screen">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-6 w-full">
          <div className="border-muted bg-background flex w-full flex-col items-center gap-y-4 rounded-md border px-6 py-6 shadow-md">
            <h1 className="text-xl font-semibold">Вход для сотрудника</h1>
            <p className="text-muted-foreground text-center text-sm">
              Приложение сотрудника больше не собирает пароль локально. Вход
              должен выполняться через Keycloak по SSO/OIDC.
            </p>

            {error && (
              <p className="text-destructive text-sm w-full text-center">
                {error}
              </p>
            )}

            <Button
              type="button"
              className="w-full"
              disabled={loading || Boolean(ssoBlocker)}
              onClick={handleSsoLogin}
            >
              {loading ? <Loader2 className="animate-spin" /> : <ExternalLink />}
              Продолжить через Keycloak
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading || Boolean(ssoBlocker)}
              onClick={handleSsoLoginAsDifferentUser}
            >
              Войти под другим аккаунтом
            </Button>

            {ssoBlocker && (
              <div className="border-destructive/30 bg-destructive/5 text-left rounded-md border p-4 w-full">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="text-destructive mt-0.5 size-4 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      SSO пока нельзя завершить полностью
                    </p>
                    <p className="text-muted-foreground text-sm">{ssoBlocker}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {appEnv.allowLegacyPasswordLogin && (
            <form
              onSubmit={handleSubmit}
              className="border-muted bg-background flex w-full flex-col items-center gap-y-4 rounded-md border px-6 py-6 shadow-md"
            >
              <h2 className="text-base font-semibold">
                Временный legacy-вход для разработки
              </h2>
              <p className="text-muted-foreground text-center text-sm">
                Используйте только пока локальная интеграция с Keycloak не
                настроена для employee-приложения.
              </p>

              <div className="w-full space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  className="text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="w-full space-y-1.5">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Пароль"
                  className="text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                Войти локально
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
