import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  code?: number;
}

const ERROR_ACTIONS: Record<string, Array<{ label: string; to: string }>> = {
  "400": [{ label: "Главная", to: "/" }],
  "401": [{ label: "Войти", to: "/login" }],
  "403": [{ label: "Главная", to: "/" }],
  "404": [{ label: "Главная", to: "/" }],
  "500": [{ label: "Обновить", to: "/" }],
  default: [{ label: "Главная", to: "/" }],
};

const ERROR_TEXTS: Record<string, { title: string; description: string }> = {
  "400": {
    title: "Некорректный запрос",
    description:
      "Похоже, запрос был сформирован неверно. Проверьте введённые данные и попробуйте снова.",
  },
  "401": {
    title: "Не авторизован",
    description:
      "Для доступа необходима авторизация. Войдите в аккаунт и попробуйте снова.",
  },
  "403": {
    title: "Доступ запрещён",
    description: "У вас нет прав для просмотра этой страницы.",
  },
  "404": {
    title: "Страница не найдена",
    description:
      "Мы не нашли запрошенную страницу. Возможно, ссылка устарела или была удалена.",
  },
  "500": {
    title: "Внутренняя ошибка сервера",
    description:
      "Что-то пошло не так на нашей стороне. Попробуйте повторить попытку позже.",
  },
  default: {
    title: "Неизвестная ошибка",
    description:
      "Произошла непредвиденная ошибка. Попробуйте повторить попытку или вернитесь на главную.",
  },
};

export default function ErrorPage({ code: codeProp }: ErrorPageProps) {
  const { code: codeParam } = useParams<{ code?: string }>();
  const parsedCode =
    codeProp ?? (codeParam ? Number.parseInt(codeParam, 10) : undefined);
  const key = Number.isFinite(parsedCode as number)
    ? String(parsedCode)
    : "default";
  const errorTexts = ERROR_TEXTS;
  const meta = errorTexts[key as keyof typeof errorTexts] ?? errorTexts.default;
  const actions = ERROR_ACTIONS[key] ?? ERROR_ACTIONS.default;

  return (
    <section className="bg-muted min-h-screen">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="border-muted bg-background mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-md border px-8 py-10 text-center shadow-md">
          {parsedCode && (
            <p className="text-muted-foreground text-sm">Код ошибки</p>
          )}
          {parsedCode && (
            <div className="text-5xl font-bold tracking-tight">
              {parsedCode}
            </div>
          )}
          <h1 className="text-xl font-semibold">{meta.title}</h1>
          <p className="text-muted-foreground max-w-prose text-sm">
            {meta.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {actions.map((action) => (
              <Button key={action.label} asChild>
                <Link to={action.to}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
