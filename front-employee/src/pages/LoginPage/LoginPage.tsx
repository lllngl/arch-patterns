import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <section className="bg-muted h-screen">
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-6 lg:justify-start max-w-sm w-full">
          <div className="border-muted bg-background flex w-full flex-col items-center gap-y-4 rounded-md border px-6 py-6 shadow-md">
            <h1 className="text-xl font-semibold">Войти</h1>
            <Input
              type="email"
              placeholder="Email"
              className="text-sm"
              required
            />
            <Input
              type="password"
              placeholder="Пароль"
              className="text-sm"
              required
            />
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </div>
          <div className="text-muted-foreground flex justify-center gap-1 text-sm">
            <p>Нет аккаунта?</p>
            <a
              href="/registration"
              className="text-primary font-medium hover:underline"
            >
              Зарегистрироваться
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
