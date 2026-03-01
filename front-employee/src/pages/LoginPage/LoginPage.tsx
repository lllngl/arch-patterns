import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { localizeError } from "@/lib/error-messages";

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user?.role !== "EMPLOYEE") {
        setError("У вас нет доступа к этой странице.");
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(localizeError(err.response?.data?.message));
      } else {
        setError("Произошла ошибка. Попробуйте позже.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-muted h-screen">
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-6 lg:justify-start max-w-sm w-full">
          <form
            onSubmit={handleSubmit}
            className="border-muted bg-background flex w-full flex-col items-center gap-y-4 rounded-md border px-6 py-6 shadow-md"
          >
            <h1 className="text-xl font-semibold">Вход для сотрудника</h1>

            {error && (
              <p className="text-destructive text-sm w-full text-center">
                {error}
              </p>
            )}

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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Войти
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
